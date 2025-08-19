const fs = require('fs')
const path = require('path')
const mammoth = require('mammoth')
const { spawn } = require('child_process')
const libre = require('libreoffice-convert')
const { promisify } = require('util')

const libreConvert = promisify(libre.convert)

/**
 * 文档转换工具类
 * 支持将DOCX、PPTX等格式转换为PDF或HTML
 * 输出函数：
 * convertDocxToHtml 将DOCX转换为HTML
 * convertDocxToText 将DOCX转换为纯文本
 * convertToPdf 将文档转换为PDF
 * convertToPdfWithCommand 使用命令行LibreOffice转换文档
 * getConvertedFilePath 获取转换后的文件路径
 * needsConversion 检查文件是否需要转换
 * isConvertedFileValid 检查转换后的文件是否有效
 * smartConvert 智能转换文档
 */
class DocumentConverter {
  
  /**
   * 将DOCX转换为HTML
   * @param {string} inputPath - 输入文件路径
   * @returns {Promise<string>} HTML内容
   */
  async convertDocxToHtml(inputPath) {
    try {
      const result = await mammoth.convertToHtml({ path: inputPath })
      return result.value
    } catch (error) {
      console.error('DOCX转HTML失败:', error)
      throw new Error('DOCX转换失败')
    }
  }

  /**
   * 将DOCX转换为纯文本
   * @param {string} inputPath - 输入文件路径
   * @returns {Promise<string>} 纯文本内容
   */
  async convertDocxToText(inputPath) {
    try {
      const result = await mammoth.extractRawText({ path: inputPath })
      return result.value
    } catch (error) {
      console.error('DOCX转文本失败:', error)
      throw new Error('DOCX转换失败')
    }
  }

  /**
   * 使用LibreOffice将文档转换为PDF
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @returns {Promise<string>} 输出文件路径
   */
  async convertToPdf(inputPath, outputPath) {
    try {
      console.log('🔄 开始PDF转换:', inputPath, '->', outputPath)
      
      // 确保输出目录存在
      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      
      // 方案1: 优先使用命令行LibreOffice (更稳定)
      try {
        await this.convertToPdfWithCommand(inputPath, outputPath)
        return outputPath
      } catch (cmdError) {
        console.warn('命令行转换失败，尝试JS库转换:', cmdError.message)
        
        // 方案2: 使用JS库作为备选方案
        const inputBuffer = fs.readFileSync(inputPath)
        const ext = path.extname(inputPath).toLowerCase()
        const pdfBuffer = await libreConvert(inputBuffer, ext, undefined)
        fs.writeFileSync(outputPath, pdfBuffer)
        
        return outputPath
      }
    } catch (error) {
      console.error('文档转PDF失败:', error)
      throw new Error(`文档转换失败: ${error.message}`)
    }
  }

  /**
   * 使用命令行LibreOffice转换文档
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @returns {Promise<void>}
   */
  async convertToPdfWithCommand(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      const outputDir = path.dirname(outputPath)
      const fileName = path.basename(inputPath)
      
      // 使用LibreOffice命令行工具
      const args = [
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', outputDir,
        inputPath
      ]
      
      console.log('🚀 执行LibreOffice命令:', 'soffice', args.join(' '))
      
      const child = spawn('soffice', args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true
      })
      
      let stdout = ''
      let stderr = ''
      
      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
             child.on('close', (code) => {
         if (code === 0) {
           // LibreOffice生成的文件名可能不同，需要重命名
           const baseName = path.parse(fileName).name
           const generatedPath = path.join(outputDir, baseName + '.pdf')
           
           if (fs.existsSync(generatedPath) && generatedPath !== outputPath) {
             fs.renameSync(generatedPath, outputPath)
           }
           
           if (fs.existsSync(outputPath)) {
             // 验证生成的PDF文件
             const stats = fs.statSync(outputPath)
             console.log('📏 生成的PDF大小:', stats.size, 'bytes')
             
             if (stats.size < 1000) {
               console.log('❌ 生成的PDF文件太小，可能转换失败')
               reject(new Error('生成的PDF文件异常小'))
               return
             }
             
             // 检查PDF头部
             try {
               const buffer = fs.readFileSync(outputPath, { start: 0, end: 7 })
               const header = buffer.toString()
               if (!header.startsWith('%PDF-')) {
                 console.log('❌ 生成的文件不是有效的PDF:', header)
                 reject(new Error('生成的文件不是有效的PDF格式'))
                 return
               }
             } catch (error) {
               console.log('❌ 无法验证PDF文件:', error.message)
               reject(new Error('无法验证生成的PDF文件'))
               return
             }
             
             console.log('✅ 命令行转换成功，PDF验证通过')
             resolve()
           } else {
             reject(new Error('转换后的文件未找到'))
           }
         } else {
           console.error('LibreOffice转换失败:', stderr)
           reject(new Error(`LibreOffice转换失败 (代码: ${code}): ${stderr}`))
         }
       })
      
      child.on('error', (error) => {
        reject(new Error(`启动LibreOffice失败: ${error.message}`))
      })
      
      // 设置超时 (30秒)
      setTimeout(() => {
        child.kill()
        reject(new Error('转换超时'))
      }, 30000)
    })
  }

  /**
   * 获取转换后的文件路径
   * @param {string} originalPath - 原始文件路径
   * @param {string} targetFormat - 目标格式 (pdf, html)
   * @returns {string} 转换后的文件路径
   */
  getConvertedFilePath(originalPath, targetFormat = 'pdf') {
    const parsedPath = path.parse(originalPath)
    const convertedDir = path.join(parsedPath.dir, 'converted')
    
    // 确保转换目录存在
    if (!fs.existsSync(convertedDir)) {
      fs.mkdirSync(convertedDir, { recursive: true })
    }
    
    return path.join(convertedDir, `${parsedPath.name}.${targetFormat}`)
  }

  /**
   * 检查文件是否需要转换
   * @param {string} filePath - 文件路径
   * @returns {boolean} 是否需要转换
   */
  needsConversion(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    return ['.docx', '.pptx', '.xlsx', '.doc', '.ppt', '.xls'].includes(ext)
  }

  /**
   * 检查转换后的文件是否存在且是最新的
   * @param {string} originalPath - 原始文件路径
   * @param {string} convertedPath - 转换后文件路径
   * @returns {boolean} 转换后文件是否有效
   */
  isConvertedFileValid(originalPath, convertedPath) {
    if (!fs.existsSync(convertedPath)) {
      return false
    }
    
    const originalStat = fs.statSync(originalPath)
    const convertedStat = fs.statSync(convertedPath)
    
    // 检查文件大小（PDF文件应该有合理的大小）
    if (convertedStat.size < 1000) { // 小于1KB的PDF很可能是损坏的
      console.log('⚠️ 转换后的PDF文件太小，可能损坏:', convertedStat.size, 'bytes')
      return false
    }
    
    // 如果是PDF文件，检查PDF头部
    if (path.extname(convertedPath).toLowerCase() === '.pdf') {
      try {
        const buffer = fs.readFileSync(convertedPath, { start: 0, end: 7 })
        const header = buffer.toString()
        if (!header.startsWith('%PDF-')) {
          console.log('⚠️ PDF文件头部无效:', header)
          return false
        }
      } catch (error) {
        console.log('⚠️ 无法读取PDF头部:', error.message)
        return false
      }
    }
    
    // 检查转换后的文件是否比原文件新
    return convertedStat.mtime >= originalStat.mtime
  }

  /**
   * 智能转换文档
   * 如果已存在有效的转换文件，则直接返回；否则进行转换
   * @param {string} inputPath - 输入文件路径
   * @param {string} targetFormat - 目标格式
   * @returns {Promise<string>} 转换后的文件路径
   */
  async smartConvert(inputPath, targetFormat = 'pdf') {
    const convertedPath = this.getConvertedFilePath(inputPath, targetFormat)
    
    // 如果转换后的文件已存在且有效，直接返回
    if (this.isConvertedFileValid(inputPath, convertedPath)) {
      console.log('使用已存在的转换文件:', convertedPath)
      return convertedPath
    }
    
    // 如果文件存在但无效，删除它
    if (fs.existsSync(convertedPath)) {
      console.log('🗑️ 删除无效的转换文件:', convertedPath)
      fs.unlinkSync(convertedPath)
    }
    
    // 进行转换
    console.log('开始转换文档:', inputPath, '->', convertedPath)
    
    if (targetFormat === 'pdf') {
      return await this.convertToPdf(inputPath, convertedPath)
    } else if (targetFormat === 'html') {
      const html = await this.convertDocxToHtml(inputPath)
      fs.writeFileSync(convertedPath, html, 'utf8')
      return convertedPath
    } else {
      throw new Error(`不支持的目标格式: ${targetFormat}`)
    }
  }
}

module.exports = new DocumentConverter()
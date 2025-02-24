const myImage = document.querySelector("img");

myImage.onclick = () => {
  const mySrc = myImage.getAttribute("src");
  if (mySrc === "image/00007.png") {
    myImage.setAttribute("src", "image/00002.png");
  } else {
    myImage.setAttribute("src", "image/00007.png");
  }
};


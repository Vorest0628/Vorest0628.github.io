const myImage = document.querySelector("img");

myImage.onclick = () => {
  const mySrc = myImage.getAttribute("src");
  if (mySrc === "image/00007.png") {
    myImage.setAttribute("src", "image/00002.png");
  } else {
    myImage.setAttribute("src", "image/00007.png");
  }
};

let myButton = document.querySelector("button");
let myHeading = document.querySelector("h1");

function setUserName() {
  const myName = prompt("Please enter your name.");
  if (!myName) {
    //setUserName();
  } else {
    localStorage.setItem("name", myName);
    myHeading.textContent = `Ciallo～(∠・ω< )⌒★, ${myName}`;
  }
}

//main function:
if (!localStorage.getItem("name")) {
  setUserName();
} else {
  const storedName = localStorage.getItem("name");
  myHeading.textContent = `Ciallo～(∠・ω< )⌒★, ${storedName}`;
}

myButton.onclick = function () {
  setUserName();
};



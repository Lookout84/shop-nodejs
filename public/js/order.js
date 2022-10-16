// const Swal = require('sweetalert2');
// // import Swal from 'sweetalert2';
// console.log(Swal);

document.querySelector("#lite-shop-order").onsubmit = function (event) {
  event.preventDefault();
  let userName = document.querySelector("#username").value.trim();
  let phone = document.querySelector("#phone").value.trim();
  let email = document.querySelector("#email").value.trim();
  let address = document.querySelector("#address").value.trim();

  if (!document.querySelector("#rule").checked) {
    Swal.fire({
      title: "Warning",
      text: "Read and accept the rule",
      info: "info",
      confirmButtonText: "Ok"
    });
    return false;
  }

  if (userName == "" || phone == "" || email == "" || address == "") {
    Swal.fire({
      title: "Warning",
      text: "Fill all fields",
      info: "info",
      confirmButtonText: "Ok"
    });
    return false;
  }

  fetch("/finish-order", {
    method: "POST",
    body: JSON.stringify({
      userName: userName,
      phone: phone,
      email: email,
      address: address,
      key: JSON.parse(localStorage.getItem("cart")),
    }),
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  })
    .then(function (response) {
      return response.text();
    })
    .then(function (body) {
      if (body == 1) {
        Swal.fire({
          title: "Success",
          text: "Success",
          info: "info",
          confirmButtonText: "Ok"
        });
      } else {
        Swal.fire({
          title: "Problem with mail",
          text: "Error",
          info: "Error",
          confirmButtonText: "Ok"
        });
      }
    });
};

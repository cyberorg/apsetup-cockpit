const AP_SSID = document.getElementById("AP_SSID");
const AP_PASS = document.getElementById("AP_PASS");
const AP_IP = document.getElementById("AP_IP");
const NET_CONNECT = document.getElementById("NET_CONNECT");
const output = document.getElementById("output");
const result = document.getElementById("result");
const button = document.getElementById("apapply");

function apsetup_run() {
  cockpit
    .spawn(
      [
        "/usr/share/cockpit/apsetup/apsetup-cockpit",
        AP_SSID.value,
        AP_PASS.value,
        AP_IP.value,
        NET_CONNECT.value,
      ],
      { superuser: true }
    )
    .stream(apapply_output)
    .then(apapply_success)
    .catch(apapply_fail);

  result.innerHTML = "";
  output.innerHTML = "";
}

function apapply_success() {
  result.style.color = "green";
  result.innerHTML = "success";
}

function apapply_fail() {
  result.style.color = "red";
  result.innerHTML = "fail";
}

function apapply_output(data) {
  output.append(document.createTextNode(data));
}

// Connect the button to starting the "ping" process
button.addEventListener("click", apsetup_run);

// Send a 'init' message.  This tells integration tests that we are ready to go
cockpit.transport.wait(function () {});


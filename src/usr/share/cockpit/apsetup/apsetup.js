const AP_SSID = document.getElementById("AP_SSID");
const AP_PASS = document.getElementById("AP_PASS");
const AP_IP = document.getElementById("AP_IP");
const NET_CONNECT = document.getElementById("NET_CONNECT");
const output = document.getElementById("output");
const result = document.getElementById("result");
const button = document.getElementById("apapply");

function apsetup_run() {
  if (document.querySelector("#apform").reportValidity()) {
    var configfile = 'AP_SSID' + '=' + AP_SSID.value + '\n' +
		  'AP_PASS' + '=' + AP_PASS.value + '\n' +
		  'AP_IP' + '=' + AP_IP.value + '\n' +
		  'NET_CONNECT' + '=' + NET_CONNECT.value + '\n';
    cockpit.file("/etc/ap.conf", { superuser: "try" }).replace(configfile);
    cockpit.spawn(
        [ "/usr/share/cockpit/apsetup/apsetup-cockpit" ],
        { superuser: true }
      )
      .stream(apapply_output)
      .then(apapply_success)
      .catch(apapply_fail);

    result.innerHTML = "";
    output.innerHTML = "";
  }
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

// Connect the button to starting the AP setup process
button.addEventListener("click", apsetup_run);

// Send a 'init' message.  This tells integration tests that we are ready to go
cockpit.transport.wait(function () {});


const NAP_SSID = document.getElementById("AP_SSID");
const NAP_PASS = document.getElementById("AP_PASS");
const NAP_IP = document.getElementById("AP_IP");
const NNET_CONNECT = document.getElementById("NET_CONNECT");
//const NNET_CONNECT_MODE = document.getElementById("NET_CONNECT_MODE");
const address = document.getElementById("address");
const output = document.getElementById("output");
const result = document.getElementById("result");
const button = document.getElementById("apapply");

function apsetup_run() {
    cockpit.spawn(["/usr/share/cockpit/apsetup/apsetup-cockpit", NAP_SSID.value, NAP_PASS.value, NAP_IP.value, NNET_CONNECT.value] , { superuser: true })
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
cockpit.transport.wait(function() { });

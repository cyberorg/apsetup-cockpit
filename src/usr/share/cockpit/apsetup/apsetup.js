cockpit
    .spawn(["bash", "-c", "if ! test -f /etc/ap.conf; then touch /etc/ap.conf && chmod 600 /etc/ap.conf; fi"], {
      superuser: true,
    })
var CVAR = [ "AP_SSID", "AP_PASS", "AP_IP", "NET_CONNECT", "AP_IFACE", "AP_MODE", "output", "result", "apapply" ];
VLen = CVAR.length;
var x = "",
  i;
for (i = 0; i < VLen; i++) {
  x = x + `const CVAR[i] = document.getElementById(CVAR[i])`;
}
function get_wl() {
  cockpit
    .spawn(["bash", "-c", "ifconfig -a|grep wl|cut -d : -f1"], {
      superuser: true,
    })
    .stream(wl_output);
}
function check_id() {
  cockpit
    .spawn(
      [
        "bash",
        "-c",
        "grep -q 'id=ap' /etc/NetworkManager/system-connections/ap* 2>/dev/null; echo $?",
      ],
      {
        superuser: true,
      }
    )
    .stream(id_output);
}
check_id();
function apsetup_run() {
  if (document.querySelector("#apform").reportValidity()) {
    var configfile =
      "AP_SSID" +
      "=" +
      AP_SSID.value +
      "\n" +
      "AP_PASS" +
      "=" +
      AP_PASS.value +
      "\n" +
      "AP_IP" +
      "=" +
      AP_IP.value +
      "\n" +
      "NET_CONNECT" +
      "=" +
      NET_CONNECT.value +
      "\n" +
      "ID_OUT" +
      "=" +
      idout +
      "AP_IFACE" +
      "=" +
      AP_IFACE.value +
      "\n" +
      "AP_MODE" +
      "=" +
      AP_MODE.value +
      "\n"
		  ;
    cockpit.file("/etc/ap.conf", { superuser: "try" }).replace(configfile);
    function spawncmd() {
      if (idout == 0) {
        cockpit
          .spawn(
            [
              "bash",
              "-c",
              "echo Please wait...;. /etc/ap.conf; nmcli con modify ap ssid $AP_SSID ipv4.addresses $AP_IP/24 wifi-sec.psk $AP_PASS mode $AP_MODE",
            ],
            { superuser: true }
          )
          .stream(apapply_output);
      } else {
        cockpit
          .spawn(
            [
              "bash",
              "-c",
              "echo Please wait...;. /etc/ap.conf; nmcli con add type wifi ifname $AP_IFACE con-name ap autoconnect yes ssid $AP_SSID ipv4.method manual ipv4.addresses $AP_IP/24 wifi-sec.key-mgmt wpa-psk wifi-sec.psk $AP_PASS 802-11-wireless.mode $AP_MODE",
            ],
            { superuser: true }
          )
          .stream(apapply_output);
      }
      cockpit
        .spawn(
          [
            "bash",
            "-c",
            "if [ ! -f /etc/NetworkManager/dispatcher.d/90apnmdispatcher ]; then cp /usr/share/cockpit/apsetup/90apnmdispatcher /etc/NetworkManager/dispatcher.d/; fi",
          ],
          { superuser: true }
        )
        .stream(apapply_output);
      cockpit
        .spawn(
          [
            "bash",
            "-c",
            "chmod 600 /etc/ap.conf; /usr/bin/nmcli con reload; /usr/bin/nmcli con up ap",
          ],
          { superuser: true }
        )
        .stream(apapply_output)
        .then(apapply_success)
        .catch(apapply_fail);
    }
    spawncmd();
    check_id();
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

function wl_output(wldata) {
  document.getElementById("AP_IFACE").value = wldata;
}
function id_output(iddata) {
  window.idout = iddata;
}

// Connect the button to starting the AP setup process
apapply.addEventListener("click", apsetup_run);

cockpit
  .file("/etc/ap.conf", { superuser: "try" })
  .read()
  .then((file) => {
    function isWhiteSpace(at) {
      if (at === "\t" || at === " ") {
        return true;
      }
    }

    let index = 0;
    const result = {};
    let section = result;
    let state = "default";
    let keyName = "";
    let value = "";
    let sectionName = "";
    while (index < file.length) {
      let at = file[index];
      if (state === "default") {
        if (at === ";" || at === "#") {
          state = "comment";
        } else if (at === "[") {
          state = "section";
        } else if (!isWhiteSpace(at)) {
          state = "key";
          index--;
        }
        console.log("default to", state);
        index++;
      } else if (state === "key") {
        if (at !== "\n" && at !== "=") {
          keyName += at;
        } else if (at === "\n") {
          state = "default";
          keyName = "";
        } else {
          state = "value";
        }
        index++;
      } else if (state === "value") {
        if (at !== "\n") {
          value += at;
        } else {
          //End of the line let's do this
          section[keyName] = value;
          keyName = "";
          value = "";
          state = "default";
        }
        index++;
      } else if (state == "section") {
        if (at === "]" || at === "\n") {
          result[sectionName] = {};
          section = result[sectionName];
          sectionName = "";
          state = "default";
        } else {
          sectionName += at;
        }
        index++;
      } else if (state === "comment") {
        if (at === "\n") {
          state = "default";
        }
        index++;
      }
    }
    if (result.AP_SSID) {
        document.getElementById("AP_SSID").value = result.AP_SSID;
    } else {
	document.getElementById("AP_SSID").value = "AKOBOX";
    }
    if (result.AP_PASS) {
	document.getElementById("AP_PASS").value = result.AP_PASS;
    } else {
        document.getElementById("AP_PASS").value = "12345678";
    }
    if (result.AP_IP) {
        document.getElementById("AP_IP").value = result.AP_IP;
    } else {
        document.getElementById("AP_IP").value = "192.168.0.1";
    }
    if (result.NET_CONNECT) {
        document.getElementById("NET_CONNECT").value = result.NET_CONNECT;
    } else {
        document.getElementById("NET_CONNECT").value = "true";
    }
    if (result.AP_IFACE) {
        document.getElementById("AP_IFACE").value = result.AP_IFACE;
    } else {
      get_wl();
    }
    if (result.AP_MODE) {
        document.getElementById("AP_MODE").value = result.AP_MODE;
    } else {
        document.getElementById("AP_MODE").value = "ap";
    }
  });
// Send a 'init' message.  This tells integration tests that we are ready to go
cockpit.transport.wait(function () {});


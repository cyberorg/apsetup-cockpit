var CVAR = [ "AP_SSID", "AP_PASS", "AP_IP", "NET_CONNECT", "output", "result", "apapply" ];
VLen = CVAR.length;
var x = "",
  i;
for (i = 0; i < VLen; i++) {
  x = x + `const CVAR[i] = document.getElementById(CVAR[i])`;
}
cockpit
  .spawn(["bash", "-c", "ifconfig -a|grep wl|cut -d : -f1"], {
    superuser: true,
  })
  .stream(wl_output);
function check_id() {
	  cockpit
  .spawn(["bash", "-c", "grep -q 'id=ap' /etc/NetworkManager/system-connections/ap* 2>/dev/null; echo $?"], {
    superuser: true,
  })
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
      "WL_IFACE" +
      "=" +
      wl;
    cockpit.file("/etc/ap.conf", { superuser: "try" }).replace(configfile);
    function spawncmd() {
      if ( idout == 0
      ) {
        cockpit
          .spawn(
            [
              "bash",
              "-c",
              "echo Please wait...;. /etc/ap.conf; nmcli con modify ap ssid $AP_SSID ipv4.addresses $AP_IP/24 wifi-sec.psk $AP_PASS",
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
              "echo Please wait...;. /etc/ap.conf; nmcli con add type wifi ifname $WL_IFACE con-name ap autoconnect yes ssid $AP_SSID ipv4.method manual ipv4.addresses $AP_IP/24 wifi-sec.key-mgmt wpa-psk wifi-sec.psk $AP_PASS 802-11-wireless.mode ap",
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
  window.wl = wldata;
}
function id_output(iddata) {
  window.idout = iddata;
}


// Connect the button to starting the AP setup process
apapply.addEventListener("click", apsetup_run);

// Send a 'init' message.  This tells integration tests that we are ready to go
cockpit.transport.wait(function () {});

cockpit.file("/etc/ap.conf", { superuser: "try" }).read()
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
        if (at === ";") {
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
    document.getElementById("AP_SSID").value = result.AP_SSID;
    document.getElementById("AP_PASS").value = result.AP_PASS;
    document.getElementById("AP_IP").value = result.AP_IP;
    document.getElementById("NET_CONNECT").value = result.NET_CONNECT;
  });


# apsetup-cockpit
Wifi Access Point setup cockpit module.

Needs **dnsmasq** and a system using **Network Manager**. Set **DNSStubListener=no** in **/etc/systemd/resolved.conf** if using systemd-resolved to allow dnsmasq to run.

```console
#Automatic install
wget -O - https://raw.githubusercontent.com/cyberorg/apsetup-cockpit/master/install.sh | sudo bash

#Manual install after git checkout
cp src/etddc/ap.conf /etc/
cp -r src/usr/share/cockpit/apsetup /usr/share/cockpit/
```
Ubuntu PPA https://launchpad.net/~jigish-gohil/+archive/ubuntu/cockpit-experiments

![](apsetup.gif)

User loging in should have sudo privileges, check "Reuse my password for privileged tasks" at login.

Using INI parser code from https://dev.to/dropconfig/making-an-ini-parser-5ejn

# apsetup-cockpit
Wifi Access Point setup cockpit module.

Needs **dnsmasq** and a system using **Network Manager**

```console
cp src/etc/ap.conf /etc/
cp -r src/usr/share/cockpit/apsetup /usr/share/cockpit/
```

![](apsetup.gif)

User loging in should have sudo privileges, check "Reuse my password for privileged tasks" at login.

Using INI parser code from https://dev.to/dropconfig/making-an-ini-parser-5ejn

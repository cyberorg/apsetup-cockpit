# apsetup-cockpit
Wifi Access Point setup cockpit module
Needs dnsmasq and a system using Network Manager
cp src/etc/ap.conf /etc/
cp src/etc/dnsmasq.d/hotspot.conf /etc/dnsmasq.d/
cp -r src/usr/share/cockpit/apsetup /usr/share/cockpit/

Modify interface-name in /usr/share/cockpit/apsetup/ap.nmconnection if needed.

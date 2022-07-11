// ELEMENTS
// Filter
const filterOrg = document.getElementById('filter-org');
const filterCat = document.getElementById('filter-cat');
const filterRole = document.getElementById('filter-role');
const filterSubmit = document.getElementById('filter-submit');
// mRNG import/export
const inputBtnImport = document.getElementById('mrng-btn-import');
const inputBtnExport = document.getElementById('mrng-btn-export');
const inputFile = document.getElementById('mrng-file');
const labelFile = document.getElementById('mrng-fname');
const labelError = document.getElementById('mrng-error');
const deviceTree = document.getElementById('mrng-content');
const controlTree = document.getElementById('mrng-control');
const deviceDetails = document.getElementById('mrng-details');
const uploadButton = document.getElementById('upload-button');
const uploadModal = document.getElementById('upload-modal');
// Alerts
const alertContainer = document.getElementById('alert-container');

const showUpload = () => { uploadModal.classList.remove('hide'); }
const hideUpload = () => { uploadModal.classList.add('hide'); }
const openDialog = () => { inputFile.click(); }
//const exportXml = () => { inputBtnExport.disabled = true; throwAlert(1,'Export is not implemented yet.'); }

// LISTENERS
filterOrg.addEventListener('change',  setOrg);
filterSubmit.addEventListener('click', filterGo);
uploadButton.addEventListener('click', showUpload);
inputBtnImport.addEventListener('click', openDialog);
inputBtnExport.addEventListener('click', exportXml);
inputFile.addEventListener('change', importCsv);
window.addEventListener('click',function(event) {
  if (event.target.tagName.toLowerCase() !== 'span' && !deviceDetails.classList.contains('md-drawer--right--closed')) {
      deviceDetails.classList.add('md-drawer--right--closed');
  }
});

function getOrgs() {
  fetch('/api/orgs', {
      method: "GET"
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return response;
  })
  .then(response => response.json())
  .then(data => renderOrgs(data))
  .catch(err => throwAlert(0,err,arguments.callee.name));
}
function renderOrgs(orgs) {
  filterOrg.querySelectorAll('option').forEach(option => option.remove());
  for (const org of orgs) {
    if (!org) continue;
    let option = document.createElement('option');
    option.innerText = org;
    option.value = org;
    filterOrg.appendChild(option);
  }
  setOrg();
}

function setOrg() {
  if (!filterOrg.value) return;
  let org = filterOrg.value;
  sessionStorage.setItem('org',org);
  let q = new URLSearchParams( { 'org': org } );
  fetch('/api/categories' + '?' + q, {
      method: "GET"
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return response;
  })
  .then(response => response.json())
  .then(data => renderFilters(data))
  .catch(err => throwAlert(0,err,arguments.callee.name));
  getDevices(q);
}

// Render filters
function renderFilters(filters) {
  let filterBy = ['cat','role'];
  const elements = {
    org: filterOrg,
    cat: filterCat,
    role: filterRole
  }
  for (const filter of filterBy) {
    elements[filter].querySelectorAll('div').forEach(option => option.remove());
    if (!filters[filter]) continue;
    let i = 0;
    for (const item of filters[filter]) {
      i++;
      let el = document.createElement('div');
      el.classList.add('md-input-container','md-checkbox');
      el.innerHTML = `<input id="${filter+i}" type="checkbox" class="md-input md-checkbox__input" value="${item}">
          <label class="md-checkbox__label" for="${filter+i}">
            <span>${item}</span>
          </label>`;
      elements[filter].appendChild(el);
      deviceTree.querySelectorAll('.mrng-connection').forEach((x) => {
        x.addEventListener('click',function() {
          deviceDetails.classList.toggle('md-drawer--right--closed');
          deviceDetails.classList.toggle('md-drawer--right');
        });
      });
    }
  }
}

// Apply filter
function filterGo() {
  if (!filterOrg.value) return;
  let org = filterOrg.value;
  let cat = [];
  let role = [];
  filterCat.querySelectorAll('input:checked').forEach(x => cat.push(x.value));
  filterRole.querySelectorAll('input:checked').forEach(x => role.push(x.value));
  let q = new URLSearchParams( { 'org': org } );
  if (cat) q.append('cat', cat);
  console.log(cat);
  if (role) q.append('role', role);
  getDevices(q);
}

function getSessionDevices() {
  if (!sessionStorage.getItem('org') && !sessionStorage.getItem('devices')) return;
  let org = sessionStorage.getItem('org');
  let devices = JSON.parse(sessionStorage.getItem('devices'));
  loader(true);
  let q = new URLSearchParams( { 'org': org } );
  for ( const device of devices ) q.append('did', device);
  getDevices(q);
}

function getDevices(query) {
  loader(true);
  query = query ? '?'+query : '';
  fetch('/api/devices' + query, {
      method: "GET"
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return response;
  })
  .then(response => response.json())
  .then(data => processResp(data))
  .catch(err => throwAlert(0,err,arguments.callee.name));
  controlTree.querySelectorAll('a').forEach(option => option.remove());
  inputBtnExport.disabled = false;
}

// CSV import
function importCsv() {
  loader(true);
  if (!inputFile.files.length) {
    throwAlert(1,'No input file found.',arguments.callee.name);
    return;
  }
  let file = inputFile.files[0];
  inputFile.value = null;
  labelFile.innerText = file.name;
  inputBtnImport.disabled=true;
  fetch('/api/upload', {
      method: "POST",
      body: file,
      headers: {
        'Accept': 'text/csv',
        'Content-Type': 'text/csv'
      }
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return response;
  })
  .then(response => response.json())
  .then(data => processResp(data))
  .catch(err => throwAlert(0,err,arguments.callee.name));
  inputBtnImport.disabled=false;
}

// Process response
function processResp(json) {
  hideUpload();
  if (json.hasOwnProperty('tree')) renderTree(json.tree);
  if (json.hasOwnProperty('devices')) saveSession(json.devices);
  throwAlert(2,'Data imported successfully.');
}

// Save current devices into session storage
function saveSession(devices) {
  if (!Array.isArray(devices)) throwAlert(0,'Wrong data type returned in json.devices!',arguments.callee.name);
  if (devices.length < 1) return;
  sessionStorage.setItem('devices', JSON.stringify(devices));
  devices = JSON.parse(sessionStorage.getItem('devices'));
}

// Render devices tree into DOM
function renderTree(tree) {

  class HtmlNode {
    name;
    address;
    icon;
    style;
    constructor(name, address = null, child = false) {
      this.name = name;
      this.icon = child ? 'icon-server_16' : 'icon-open-in-folder_16';
      this.style = child ? 'mrng-connection' : 'mrng-container';
      this.address = address ? ' (' + address + ')' : '';
      this.name += this.address;
    }
    getNode() {
      let div = document.createElement('div');
      let icon = document.createElement('i');
      let title = document.createElement('span');
      icon.classList.add('icon',this.icon);
      title.innerText = this.name;
      div.appendChild(icon);
      div.appendChild(title);
      div.classList.add(this.style);
      return div;
    }
  }

  function treeRecursive(tree, parent) {
    if (Array.isArray(tree)) {
      for (const item of tree) {
        let childObj = new HtmlNode(item.name, item.address, true);
        let child = childObj.getNode();
        parent.appendChild(child);
      }
    } else {
      for (const item in tree) {
        if (typeof tree[item] !== 'object' || tree[item] === null) continue;
        let childObj = new HtmlNode(item);
        let child = childObj.getNode();
        child = treeRecursive(tree[item],child);
        parent.appendChild(child);
      }
    }
    return parent;
  }

  if (deviceTree.querySelector('div')) deviceTree.querySelector('div').remove();
  let div = document.createElement('div');
  let divTree = treeRecursive(tree,div);
  deviceTree.appendChild(divTree);
  deviceTree.querySelectorAll('.mrng-connection').forEach((x) => {
    x.querySelector('span').addEventListener('click',function() {
      deviceDetails.classList.remove('md-drawer--right--closed');
    });
  });
  sessionStorage.setItem('tree', JSON.stringify(tree))
  inputBtnExport.disabled=false;
}


function exportXml() {

  class XmlNode {
    name;
    type;
    host;
    proto = 'RDP';
    port = '3389';
    constructor(name, type, host) {
      this.type = type;
      this.name = name;
      this.host = host;
    }
    getNode() {
      let node = `<Node Name="${this.name}" Type="${this.type}" Expanded="true" Descr="" Icon="mRemoteNG" Panel="General" Id="" \
Username="" Domain="" Password="" Hostname="${this.host}" Protocol="${this.proto}" PuttySession="Default Settings" Port="${this.port}" \
ConnectToConsole="false" UseCredSsp="true" RenderingEngine="IE" ICAEncryptionStrength="EncrBasic" \
RDPAuthenticationLevel="NoAuth" RDPMinutesToIdleTimeout="0" RDPAlertIdleTimeout="false" LoadBalanceInfo="" \
Colors="Colors16Bit" Resolution="FitToWindow" AutomaticResize="true" DisplayWallpaper="false" DisplayThemes="false" \
EnableFontSmoothing="false" EnableDesktopComposition="false" CacheBitmaps="false" \
RedirectDiskDrives="false" RedirectPorts="false" RedirectPrinters="false" RedirectSmartCards="false" \
RedirectSound="DoNotPlay" SoundQuality="Dynamic" RedirectKeys="false" Connected="false" \
PreExtApp="" PostExtApp="" MacAddress="" UserField="" ExtApp="" \
VNCCompression="CompNone" VNCEncoding="EncHextile" VNCAuthMode="AuthVNC" VNCProxyType="ProxyNone" VNCProxyIP="" VNCProxyPort="0" \
VNCProxyUsername="" VNCProxyPassword="" VNCColors="ColNormal" VNCSmartSizeMode="SmartSAspect" VNCViewOnly="false" \
RDGatewayUsageMethod="Never" RDGatewayHostname="" RDGatewayUseConnectionCredentials="Yes" RDGatewayUsername="" RDGatewayPassword="" RDGatewayDomain="" \
InheritCacheBitmaps="true" InheritColors="true" InheritDescription="true" InheritDisplayThemes="true" InheritDisplayWallpaper="true" \
InheritEnableFontSmoothing="true" InheritEnableDesktopComposition="true" InheritDomain="true" InheritIcon="true" InheritPanel="true" \
InheritPassword="true" InheritPort="true" InheritProtocol="true" InheritPuttySession="true" InheritRedirectDiskDrives="true" \
InheritRedirectKeys="true" InheritRedirectPorts="true" InheritRedirectPrinters="true" InheritRedirectSmartCards="true" InheritRedirectSound="true" \
InheritSoundQuality="true" InheritResolution="true" InheritAutomaticResize="true" InheritUseConsoleSession="true" InheritUseCredSsp="true" \
InheritRenderingEngine="true" InheritUsername="true" InheritICAEncryptionStrength="true" InheritRDPAuthenticationLevel="true" \
InheritRDPMinutesToIdleTimeout="true" InheritRDPAlertIdleTimeout="true" InheritLoadBalanceInfo="true" InheritPreExtApp="true" InheritPostExtApp="true" \
InheritMacAddress="true" InheritUserField="true" InheritExtApp="true" InheritVNCCompression="true" InheritVNCEncoding="true" InheritVNCAuthMode="true" \
InheritVNCProxyType="true" InheritVNCProxyIP="true" InheritVNCProxyPort="true" InheritVNCProxyUsername="true" InheritVNCProxyPassword="true" \
InheritVNCColors="true" InheritVNCSmartSizeMode="true" InheritVNCViewOnly="true" InheritRDGatewayUsageMethod="true" InheritRDGatewayHostname="true" \
InheritRDGatewayUseConnectionCredentials="true" InheritRDGatewayUsername="true" InheritRDGatewayPassword="true" InheritRDGatewayDomain="true">
`;
      return node;
    }
  }

  function treeObjRecursive(tree) {
    let xml = '';
    for (const t in tree) {
      let cont = new XmlNode(t,'Container','');
      let xmlCont = cont.getNode();
      xml += xmlCont;
      if (Array.isArray(tree[t])) {
        for (const c of tree[t]) {
          let conn = new XmlNode(c.name, 'Connection', c.address);
          let xmlConn = conn.getNode().replace('>', ' />');
          xml += xmlConn;
        }
      } else if (typeof tree[t] === 'object' && tree[t] !== null) {
        xml += treeObjRecursive(tree[t]);
      }
      xml += '</Node>\n';
    }
    return xml;
  }

  const sessionTree = sessionStorage.getItem('tree') ? sessionStorage.getItem('tree') : null;
  const tree = JSON.parse(sessionTree);
  if (!tree) return;
  let data = `<?xml version="1.0" encoding="utf-8"?>
<mrng:Connections xmlns:mrng="http://mremoteng.org" Name="Connections" Export="false" EncryptionEngine="AES" BlockCipherMode="GCM" KdfIterations="1000" FullFileEncryption="false" Protected="+tszw1aa6zsrw4XXncIBklhlbEcftMtjgGDiCPG573TWfCvsudz8PKKPHFhynvdLzePvBFTZ6APEQPg97tKKk+xb" ConfVersion="2.6">
`;
  data += treeObjRecursive(tree);
  data += '</mrng:Connections>';
  const a = document.createElement('a');
  const blob = new Blob ([data], {type: 'text/xml'});
  a.href = window.URL.createObjectURL(blob);
  let date = new Date();
  let filename = `${Object.keys(tree)[0].replace(/[^a-z0-9]/gi, '_')}_mRemote_nocreds_${date.toISOString().split('T')[0]}.xml`;
  a.download = filename;
  a.innerText = filename;
  controlTree.appendChild(a);
  inputBtnExport.disabled=true;
}

// Show/hide loader animation
function loader(state) {
  const loading = document.getElementById('loader');
  const load = '<i class="md-spinner md-spinner--36 md-spinner--blue"></i>';
  if (!state && loading) {
    loading.remove();
  } else if (state && !loading) {
    const loadingNew = document.createElement('div');
    loadingNew.innerHTML = load;
    loadingNew.id = 'loader';
    document.body.appendChild(loadingNew);
  }
}

// Fire alert popup
function throwAlert(lvl,msg,src=null) {
  loader(false);
  if (src) msg += ` (in ${src}).`;
  const levels = ['error','warning','success','info'];
  const alertPopup = document.createElement('div')
  alertPopup.classList.add('md-alert','md-alert--' + levels[lvl]);
  const alertTemplate = `
    <div class="md-alert__icon"></div>
    <div class="md-alert__content">
      <div class="md-alert__title">${levels[lvl].toUpperCase()}!</div>
      <div class="md-alert__message">
        ${msg}
      </div>
    </div>
    <div class="md-alert__button">
      <button type="button" class="md-button md-button--circle md-button--large" onclick="cancelAlert(this)">
        <span class="md-button__children icon icon-cancel_14"></span>
      </button>
    </div>`;
  alertPopup.innerHTML = alertTemplate;
  alertContainer.appendChild(alertPopup);
  setTimeout(function() { cancelAlert(this) }.bind(alertPopup),6000);
}

function cancelAlert(el) {
  el.closest('div.md-alert').remove();
}


window.onload = function() {
  // Initialize page
  getOrgs();
}

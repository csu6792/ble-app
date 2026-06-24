// =======================
// BLE UUID
// =======================

const SERVICE =
"12345678-1234-1234-1234-000000000001";


const INFO =
"12345678-1234-1234-1234-000000000010";


const DATA =
"12345678-1234-1234-1234-000000000020";


const COMMAND =
"12345678-1234-1234-1234-000000000030";




// =======================
// BLE variables
// =======================

let bleDevice = null;

let bleServer = null;

let commandChar = null;

let dataChar = null;





// =======================
// Connect
// =======================

async function connect()
{

try
{


document.getElementById("status")
.innerHTML =
"狀態：搜尋裝置";



// 搜尋 ESP32

bleDevice =
await navigator.bluetooth.requestDevice(
{

filters:
[
{
name:
"Interactive_Device"
}
],


optionalServices:
[
SERVICE
]

});




// 連線

bleServer =
await bleDevice.gatt.connect();



document.getElementById("status")
.innerHTML =
"狀態：已連線";





// 斷線事件

bleDevice.addEventListener(
"gattserverdisconnected",
()=>{


document.getElementById("status")
.innerHTML =
"狀態：斷線";


commandChar = null;

dataChar = null;


});






// 取得 Service

let service =
await bleServer.getPrimaryService(
SERVICE
);





// =======================
// DEVICE INFO
// =======================


let infoChar =
await service.getCharacteristic(
INFO
);



let infoValue =
await infoChar.readValue();



let infoText =
new TextDecoder()
.decode(infoValue);



document.getElementById("info")
.innerHTML =
infoText;








// =======================
// DATA Notify
// =======================


dataChar =
await service.getCharacteristic(
DATA
);



await dataChar.startNotifications();



dataChar.addEventListener(
"characteristicvaluechanged",
(event)=>
{


let text =
new TextDecoder()
.decode(
event.target.value
);



console.log(
"DATA:",
text
);



try
{


let json =
JSON.parse(text);



document.getElementById("temp")
.innerHTML =
json.temp;



document.getElementById("hum")
.innerHTML =
json.hum;



}
catch(e)
{

console.log(
"JSON error",
e
);

}


});








// =======================
// COMMAND
// =======================


commandChar =
await service.getCharacteristic(
COMMAND
);




document.getElementById("status")
.innerHTML =
"狀態：ESP32 已就緒";



}

catch(e)
{


console.error(e);


document.getElementById("status")
.innerHTML =
"錯誤："
+
e.message;


}

}








// =======================
// LED control
// =======================

async function led(on)
{


if(!commandChar)
{

alert(
"請先連接 ESP32"
);

return;

}



let text =
on ?
"LED_ON"
:
"LED_OFF";



await commandChar.writeValue(

new TextEncoder()
.encode(text)

);


}








// =======================
// Disconnect
// =======================

function disconnect()
{


if(
bleDevice &&
bleDevice.gatt.connected
)
{


bleDevice.gatt.disconnect();



}



commandChar = null;

dataChar = null;

bleServer = null;



document.getElementById("status")
.innerHTML =
"狀態：已斷線";



document.getElementById("temp")
.innerHTML =
"--";


document.getElementById("hum")
.innerHTML =
"--";


document.getElementById("info")
.innerHTML =
"--";



}
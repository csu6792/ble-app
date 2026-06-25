// =======================
// BLE UUID
// =======================
const SERVICE = "12345678-1234-1234-1234-000000000001";
const INFO    = "12345678-1234-1234-1234-000000000010";
const DATA    = "12345678-1234-1234-1234-000000000020";
const COMMAND = "12345678-1234-1234-1234-000000000030";

let bleDevice = null;
let bleServer = null;
let commandChar = null;
let dataChar = null;

// =======================
// Connect
// =======================
async function connect() {
    try {
        document.getElementById("status").innerHTML = "狀態：搜尋裝置中...";
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ name: "Interactive_Device" }],
            optionalServices: [SERVICE]
        });

        bleServer = await bleDevice.gatt.connect();
        document.getElementById("status").innerHTML = "狀態：已連線";

        bleDevice.addEventListener("gattserverdisconnected", () => {
            document.getElementById("status").innerHTML = "狀態：斷線";
            commandChar = null; dataChar = null;
        });

        let service = await bleServer.getPrimaryService(SERVICE);

        // 讀取裝置資訊
        let infoChar = await service.getCharacteristic(INFO);
        let infoValue = await infoChar.readValue();
        document.getElementById("info").innerHTML = new TextDecoder().decode(infoValue);

        // 訂閱感測器資料
        dataChar = await service.getCharacteristic(DATA);
        await dataChar.startNotifications();
        dataChar.addEventListener("characteristicvaluechanged", (event) => {
            let text = new TextDecoder().decode(event.target.value);
            console.log("DATA:", text);
            try {
                let json = JSON.parse(text);
                // 更新畫面 (配合 ESP32 縮短的 JSON key)
                if(json.t !== undefined) document.getElementById("temp").innerHTML = json.t;
                if(json.h !== undefined) document.getElementById("hum").innerHTML = json.h;
                if(json.l !== undefined) document.getElementById("light").innerHTML = json.l;
                if(json.p !== undefined) document.getElementById("pot").innerHTML = json.p;
                if(json.a !== undefined) document.getElementById("btnA").innerHTML = json.a ? "按下" : "放開";
                if(json.b !== undefined) document.getElementById("btnB").innerHTML = json.b ? "按下" : "放開";
            } catch(e) {
                console.log("JSON parse error", e);
            }
        });

        // 取得指令特徵值
        commandChar = await service.getCharacteristic(COMMAND);
        document.getElementById("status").innerHTML = "狀態：ESP32 已就緒";

    } catch(e) {
        console.error(e);
        document.getElementById("status").innerHTML = "錯誤：" + e.message;
    }
}

// =======================
// 指令控制區
// =======================
async function sendCmd(cmdStr) {
    if(!commandChar) { alert("請先連接 ESP32"); return; }
    await commandChar.writeValue(new TextEncoder().encode(cmdStr));
}

async function sendOLED() {
    let text = document.getElementById("oledInput").value;
    if(text.trim() === "") return;
    await sendCmd("OLED:" + text);
}

async function sendRGB() {
    let colorHex = document.getElementById("rgbInput").value; // e.g., #ff0000
    await sendCmd("RGB:" + colorHex);
}

// =======================
// Disconnect
// =======================
function disconnect() {
    if(bleDevice && bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
    }
    commandChar = null; dataChar = null; bleServer = null;
    document.getElementById("status").innerHTML = "狀態：已斷線";
}

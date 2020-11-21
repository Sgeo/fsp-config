const INITIAL_XML_STRING = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
    <configSections>
        <section name="flashpointSecurePlayer" type="FlashpointSecurePlayer.Shared+FlashpointSecurePlayerSection, FlashpointSecurePlayer, Version=2.0.0.0, Culture=neutral, PublicKeyToken=null" />
    </configSections>
    <flashpointSecurePlayer>
        <templates>
            <template name="INSERT_NAME_HERE">
                <mode name="WEB_BROWSER" />
                <modifications>
                    <registryStates binaryType="SCS_32BIT_BINARY">
                    </registryStates>
                </modifications>
            </template>
        </templates>
    </flashpointSecurePlayer>
</configuration>
`;

class Converter {
    constructor() {
        let parser = new DOMParser();
        this._xmldocument = parser.parseFromString(INITIAL_XML_STRING, "text/xml");
        this._xmlserializer = new XMLSerializer();
        this._currentKey = null;
        this._registryStates = this._xmldocument.querySelector("registryStates");

    }

    regValueInfo(preparseValueValue) {
        if(preparseValueValue[0] === '"') {
            return {
                fspKind: "String",
                value: preparseValueValue.match(/"(.*)"/)[1]
            };
        } else if (preparseValueValue.slice(0, 6) === "dword:") {
            let hex = preparseValueValue.slice(6);
            return {
                fspKind: "DWord",
                value: parseInt(hex, 16)
            };
        } else if(preparseValueValue.slice(0, 7) == "hex(3):") {
            let bytesHex = preparseValueValue.slice(7).split(",");
            let bytes = bytesHex.map(h => parseInt(h, 16));
            let b64 = btoa(String.fromCharCode(...bytes));
            return {
                fspKind: "binary",
                value: b64
            };
        }
    }

    convert(input) {
        let lines = input.split("\n");
        for(let line of lines) {
            if(line.startsWith("[")) {
                let match = line.match(/\[(.*)\]/);
                let key = match[1];
                this._currentKey = key;
            } else {
                let [preparseValueName, preparseValueValue] = line.split("=");
                if(typeof preparseValueValue === "undefined") {
                    continue;
                }
                let valueName;
                let valueValue;
                let valueType;
                if(preparseValueName === "@") {
                    valueName = "";
                } else {
                    valueName = preparseValueName.match(/"(.*)"/)[1];
                }

                let valueValueData = this.regValueInfo(preparseValueValue);

                valueType = valueValueData.fspKind;

                valueValue = valueValueData.value;

                this.placeNode(this._currentKey, valueName, valueValue, valueType);

            }
        }
        return this._xmlserializer.serializeToString(this._xmldocument);
    }

    placeNode(key, valueName, valueValue, valueType) {
        let node = this._xmldocument.createElement("registryState");
        node.setAttribute("type", "VALUE");
        node.setAttribute("keyName", key);
        node.setAttribute("valueName", valueName);
        node.setAttribute("value", valueValue);
        node.setAttribute("valueKind", valueType);
        this._registryStates.append(node);
    }

}

const CONVERTER = new Converter();

document.getElementById("form").addEventListener("submit", function(e) {
    e.preventDefault();
    document.getElementById("out").value = CONVERTER.convert(document.getElementById("in").value);
});
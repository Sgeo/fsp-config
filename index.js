const INITIAL_XML_STRING = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
    <configSections>
        <section name="flashpointSecurePlayer" type="FlashpointSecurePlayer.Shared+FlashpointSecurePlayerSection, FlashpointSecurePlayer, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null" />
    </configSections>
    <flashpointSecurePlayer>
        <modifications>
            <modification name="INSERTNAMEHERE">
                <registryBackups binaryType="SCS_32BIT_BINARY">

                </registryBackups>
            </modification>
        </modifications>
    </flashpointSecurePlayer>
</configuration>
`;

class Converter {
    constructor() {
        let parser = new DOMParser();
        this._xmldocument = parser.parseFromString(INITIAL_XML_STRING, "text/xml");
        this._xmlserializer = new XMLSerializer();
        this._currentKey = null;
        this._registryBackups = this._xmldocument.querySelector("registryBackups");

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

                // TODO: non-Strings

                valueType = "REG_SZ";

                valueValue = preparseValueValue.match(/"(.*)"/)[1];

                this.placeNode(this._currentKey, valueName, valueValue, valueType);

            }
        }
        return this._xmlserializer.serializeToString(this._xmldocument);
    }

    placeNode(key, valueName, valueValue, valueType) {
        let node = this._xmldocument.createElement("registryBackup");
        node.setAttribute("type", "VALUE");
        node.setAttribute("keyName", key);
        node.setAttribute("valueName", valueName);
        node.setAttribute("value", valueValue);
        node.setAttribute("valueKind", "String");
        this._registryBackups.append(node);
    }

}

const CONVERTER = new Converter();

document.getElementById("form").addEventListener("submit", function(e) {
    e.preventDefault();
    document.getElementById("out").value = CONVERTER.convert(document.getElementById("in").value);
});
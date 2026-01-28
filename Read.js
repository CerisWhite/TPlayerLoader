const fs = require('fs');
const RJ = require('rijndael-js');
const CryptKey = Buffer.from("h3y_gUyZ", "utf16le");

BigInt.prototype.toJSON = function() {
  return this.toString();
};

if (process.argv.length < 3) { console.log("Provide a player file path."); return; }
const SaveData = fs.readFileSync(process.argv[2]);
if (!fs.existsSync('./Backup')) { fs.mkdirSync('./Backup'); }
fs.writeFileSync('./Backup/' + Date.now() + '.plr', SaveData);
const ItemID = JSON.parse(fs.readFileSync('./ItemID.json'));
const Prefix = JSON.parse(fs.readFileSync('./Prefix.json'));

const Cipher = new RJ(CryptKey, 'cbc');
const Input = Buffer.from(Cipher.decrypt(SaveData, 128, CryptKey));

let Save = {
	Metadata: {},
	Data: {},
	Appearance: {},
	Stats: {},
	Flags: {},
	Armor: [],
	Dye: [],
	Inventory: [],
	MiscEquip: [],
	Bank: [],
	Bank2: [],
	Bank3: [],
	Bank4: [],
	VoidVaultInfo: 0, // ???
	Buffs: [],
	Spawnpoint: [],
	HideInfo: [],
	AnglerQuestCount: 0,
	DPadBinding: [],
	BuilderAccStatus: [],
	TavernQuestCount: 0,
	DeadStatus: {},
	LastSaved: 0n,
	GolfScore: 0,
	/*
	SacrificeCount: 0,
	TempItemByte: 0,
	TempItemSlot: [],
	SuperCartByte: 0,
	CurrentLoadout: 0
	*/
	Unknown: ""
}

let Offset = 0;
function CSReadString() {
	const Length = Input.readUInt8(Offset);
	const Value = Input.slice(Offset + 1, Offset + Length + 1).toString();
	Offset += Length + 1;
	return Value;
}
function CSReadBool() {
	const Value = Input.readUInt8(Offset);
	Offset += 1;
	if (Value == 1) { return true; }
	return false;
}
function CSReadByte() {
	const Value = Input.readUInt8(Offset);
	Offset += 1;
	return Value;
}
function CSReadSByte() {
	const Value = Input.readInt8(Offset);
	Offset += 1;
	return Value;
}
function CSReadRGB() {
	const R = Input.readUInt8(Offset);
	const G = Input.readUInt8(Offset + 1);
	const B = Input.readUInt8(Offset + 2);
	Offset += 3;
	const Value = R.toString(16) + G.toString(16) + B.toString(16);
	return Value;
}
function CSReadUInt16() {
	const Value = Input.readUInt16LE(Offset);
	Offset += 2;
	return Value;
}
function CSReadSInt16() {
	const Value = Input.readInt16LE(Offset);
	Offset += 2;
	return Value;
}
function CSReadUInt32() {
	const Value = Input.readUInt32LE(Offset);
	Offset += 4;
	return Value;
}
function CSReadSInt32() {
	const Value = Input.readInt32LE(Offset);
	Offset += 4;
	return Value;
}
function CSReadUInt64() {
	const Value = Input.readBigUInt64LE(Offset);
	Offset += 8;
	return Value;
}
function CSReadSInt64() {
	const Value = Input.readBigInt64LE(Offset);
	Offset += 8;
	return Value;
}
function ReadItemID() {
	const Value = Input.readInt32LE(Offset);
	Offset += 4;
	const Item = ItemID.find(x=>x.id == Value);
	if (Item != undefined) {
		return Item.name;
	}
	return Value;
}
function ReadPrefixID() {
	const Value = Input.readUInt8(Offset);
	Offset += 1;
	const Modif = Prefix.find(x=>x.id == Value);
	if (Modif != undefined) {
		return Modif.name;
	}
	return Value;
}
function ParseFile() {
	Save['Metadata']['Release'] = CSReadSInt32();
	Save['Metadata']['FormatString'] = CSReadUInt64();
	Save['Metadata']['Revision'] = CSReadUInt32();
	Save['Metadata']['IsFavorite'] = CSReadUInt64();
	Save['Data']['Name'] = CSReadString();

	// ---- Save Validation? ----
	const HeaderCheck = Save['Metadata']['FormatString'] & 0xFFFFFFFFFFFFFFn; // == 27981915666277746
	if ( ((Save['Metadata']['FormatString']>>56n) & 0xFFn) != 3) { console.log("Not a player file!"); }
	// --------------------------

	if (Save['Metadata']['Release'] >= 279) {
		Save['Data']['Difficulty'] = CSReadByte();
		Save['Data']['PlayTime'] = CSReadSInt64();
		Save['Appearance']['Hair'] = CSReadSInt32();
		Save['Appearance']['HairDye'] = CSReadByte();
		Save['Appearance']['HiddenAccessory'] = CSReadByte();
		Save['Appearance']['HiddenAccessory2'] = CSReadByte();
		Save['Appearance']['HiddenMisc'] = CSReadByte();
		Save['Appearance']['Skin'] = CSReadByte();
		Save['Stats']['Life'] = CSReadSInt32();
		Save['Stats']['LifeMax'] = CSReadSInt32();
		Save['Stats']['Mana'] = CSReadSInt32();
		Save['Stats']['ManaMax'] = CSReadSInt32();
		Save['Flags']['ExtraAccessory'] = CSReadBool();
		Save['Flags']['TorchGod'] = CSReadBool();
		Save['Flags']['TorchGodActive'] = CSReadBool();
		Save['Flags']['ArtisanBread'] = CSReadBool();
		Save['Flags']['AegisCrystal'] = CSReadBool();
		Save['Flags']['AegisFruit'] = CSReadBool();
		Save['Flags']['ArcaneCrystal'] = CSReadBool();
		Save['Flags']['GalaxyPearl'] = CSReadBool();
		Save['Flags']['GummyWorm'] = CSReadBool();
		Save['Flags']['Ambrosia'] = CSReadBool();
		Save['Flags']['DefeatedOOA'] = CSReadBool();
		Save['Stats']['TaxMoney'] = CSReadSInt32();
		Save['Stats']['PVEDeaths'] = CSReadSInt32();
		Save['Stats']['PVPDeaths'] = CSReadSInt32();
		Save['Appearance']['HairColor'] = CSReadRGB();
		Save['Appearance']['SkinColor'] = CSReadRGB();
		Save['Appearance']['EyeColor'] = CSReadRGB();
		Save['Appearance']['ShirtColor'] = CSReadRGB();
		Save['Appearance']['UndershirtColor'] = CSReadRGB();
		Save['Appearance']['PantsColor'] = CSReadRGB();
		Save['Appearance']['ShoeColor'] = CSReadRGB();
		let a = 0; while (a < 20) { // "num3"
			Save['Armor'].push({
				'ID': ReadItemID(),
				'Prefix': ReadPrefixID()
			});
			a++;
		}
		let d = 0; while (d < 10) { // "num4"
			Save['Dye'].push({
				'ID': ReadItemID(),
				'Prefix': ReadPrefixID()
			});
			d++;
		}
		let i = 0; while (i < 58) { // "num6"
			// There's unique handling for items above the ID limit but it's exactly the same???'
			Save['Inventory'].push({
				'ID': ReadItemID(), // "num7"
				'Count': CSReadSInt32(),
				'Prefix': ReadPrefixID(),
				'Favorite': CSReadBool()
			});
			i++;
		}
		let m = 0; while (m < 5) { // "num12"
			Save['MiscEquip'].push({
				'ID': ReadItemID(),
				'Prefix': ReadPrefixID(),
				'Dye': {
					'ID': ReadItemID(),
					'Prefix': ReadPrefixID()
				}
			});
			m++;
		}
		let b = 0; while (b < 40) { // "num14"
			Save['Bank'].push({
				'ID': ReadItemID(),
				'Count': CSReadSInt32(),
				'Prefix': ReadPrefixID()
			});
			b++;
		}
		let b2 = 0; while (b2 < 40) { // "num15"
			Save['Bank2'].push({
				'ID': ReadItemID(),
				'Count': CSReadSInt32(),
				'Prefix': ReadPrefixID()
			});
			b2++;
		}
		let b3 = 0; while (b3 < 40) { // "num18"
			Save['Bank3'].push({
				'ID': ReadItemID(),
				'Count': CSReadSInt32(),
				'Prefix': ReadPrefixID()
			});
			b3++;
		}
		let b4 = 0; while (b4 < 40) { // "num19"
			Save['Bank4'].push({
				'ID': ReadItemID(),
				'Count': CSReadSInt32(),
				'Prefix': ReadPrefixID(),
				'Favorite': CSReadBool()
			});
			b4++;
		}
		Save['VoidVaultInfo'] = CSReadByte();
		let buff = 0; while (buff < 44) { // "num27"
			const Type = CSReadSInt32();
			Save['Buffs'].push({
				'ID': Type,
				'Duration': CSReadSInt32()
			});
			//if (Type == 0) { buff--; buffmax--; }
			buff++;
		}
		let sp = 0; while (sp < 200) { // "num29"
			const X = CSReadSInt32();
			if (X == -1) { break; }
			Save['Spawnpoint'].push({
				'spX': X,
				'spY': CSReadSInt32(),
				'spI': CSReadSInt32(),
				'spN': CSReadString()
			});
			sp++;
		}
		Save['Flags']['HBLocked'] = CSReadBool();
		let h = 0; while (h < 13) { // "num31"
			Save['HideInfo'].push(CSReadBool());
			h++;
		}
		Save['AnglerQuestCount'] = CSReadSInt32();
		let dpad = 0; while (dpad < 4) {
			Save['DPadBinding'].push(CSReadSInt32());
			dpad++;
		}
		let bas = 0; while (bas < 12) { // "num34"
			Save['BuilderAccStatus'].push(CSReadSInt32());
			bas++;
		}
		Save['TavernQuestCount'] = CSReadSInt32();
		Save['DeadStatus']['IsDead'] = CSReadBool();
		if (Save['DeadStatus']['IsDead'] == true) { Save['DeadStatus']['RespawnTimer'] = CSReadSInt32(); }
		Save['LastSaved'] = CSReadSInt64();
		Save['GolfScore'] = CSReadSInt32();
		/*
		Save['SacrificeCount'] = CSReadSInt32();
		let s = 0; while (s < Save['SacrificeCount']) { // I have no clue what this is???
			const Key = CSReadString();
			const Value = CSReadSInt32();
			s++;
		}
		Save['TempItemByte'] = CSReadByte();
		// If bits 1-4 are set, this adds temporary items?
		// Ignore this for now
		// if (TempItemBit1 == 1) { 32, 32, byte } ...
		while (CSReadBool() == true) {
			const Key = CSReadUInt16();
			
		}
		Save['SuperCartByte'] = CSReadByte();
		Save['CurrentLoadout'] = CSReadSInt32();
		*/
		Save['Unknown'] = Input.slice(Offset, Input.length).toString('base64');
	}
	else { console.log("Unsupported save version"); }
}

let Temp = Buffer.alloc(1048576); // Create a large buffer to construct the file
let Onset = 0;
function CSWriteString(Data) {
	const Length = Data.length;
	Temp.writeUInt8(Length, Onset);
	Temp.write(Data, Onset + 1, Length, 'utf8');
	Onset += Length + 1;
	return;
}
function CSWriteBool(Data) {
	if (Data == true) {
		Temp.writeUInt8(1, Onset);
	}
	else {
		Temp.writeUInt8(0, Onset);
	}
	Onset += 1;
	return;
}
function CSWriteByte(Data) {
	Temp.writeUInt8(Data, Onset);
	Onset += 1;
	return;
}
function CSWriteSByte(Data) {
	Temp.writeInt8(Data, Onset);
	Onset += 1;
	return;
}
function CSWriteRGB(Data) {
	Temp.writeUInt8(parseInt(Data.slice(0, 2), 16), Onset);
	Temp.writeUInt8(parseInt(Data.slice(2, 4), 16), Onset + 1);
	Temp.writeUInt8(parseInt(Data.slice(4, 6), 16), Onset + 2);
	Onset += 3;
	return;
}
function CSWriteUInt16(Data) {
	Temp.writeUInt16LE(Data, Onset);
	Onset += 2;
	return;
}
function CSWriteSInt16(Data) {
	Temp.writeInt16LE(Data, Onset);
	Onset += 2;
	return;
}
function CSWriteUInt32(Data) {
	Temp.writeUInt32LE(Data, Onset);
	Onset += 4;
	return;
}
function CSWriteSInt32(Data) {
	Temp.writeInt32LE(Data, Onset);
	Onset += 4;
	return;
}
function CSWriteUInt64(Data) {
	Temp.writeBigUInt64LE(BigInt(Data), Onset);
	Onset += 8;
	return;
}
function CSWriteSInt64(Data) {
	Temp.writeBigInt64LE(BigInt(Data), Onset);
	Onset += 8;
	return;
}
function WriteItemID(Data) {
	const Item = ItemID.find(x => x.name == Data);
	if (Item != undefined) {
		Temp.writeInt32LE(Item.id, Onset);
	}
	else {
		Temp.writeInt32LE(Data, Onset);
	}
	Onset += 4;
	return;
}
function WritePrefixID(Data) {
	const Modif = Prefix.find(x => x.name == Data);
	if (Modif != undefined) {
		Temp.writeUInt8(Modif.id, Onset);
	}
	else {
		Temp.writeUInt8(Data, Onset);
	}
	Onset += 1;
	return;
}
function SerializeFile(NewSave) {
	CSWriteSInt32(NewSave['Metadata']['Release']);
	CSWriteUInt64(NewSave['Metadata']['FormatString']);
	CSWriteUInt32(NewSave['Metadata']['Revision']);
	CSWriteUInt64(NewSave['Metadata']['IsFavorite']);
	CSWriteString(NewSave['Data']['Name']);
	
	if (NewSave['Metadata']['Release'] >= 279) {
		CSWriteByte(NewSave['Data']['Difficulty']);
		CSWriteSInt64(NewSave['Data']['PlayTime']);
		CSWriteSInt32(NewSave['Appearance']['Hair']);
		CSWriteByte(NewSave['Appearance']['HairDye']);
		CSWriteByte(NewSave['Appearance']['HiddenAccessory']);
		CSWriteByte(NewSave['Appearance']['HiddenAccessory2']);
		CSWriteByte(NewSave['Appearance']['HiddenMisc']);
		CSWriteByte(NewSave['Appearance']['Skin']);
		CSWriteSInt32(NewSave['Stats']['Life']);
		CSWriteSInt32(NewSave['Stats']['LifeMax']);
		CSWriteSInt32(NewSave['Stats']['Mana']);
		CSWriteSInt32(NewSave['Stats']['ManaMax']);
		CSWriteBool(NewSave['Flags']['ExtraAccessory']);
		CSWriteBool(NewSave['Flags']['TorchGod']);
		CSWriteBool(NewSave['Flags']['TorchGodActive']);
		CSWriteBool(NewSave['Flags']['ArtisanBread']);
		CSWriteBool(NewSave['Flags']['AegisCrystal']);
		CSWriteBool(NewSave['Flags']['AegisFruit']);
		CSWriteBool(NewSave['Flags']['ArcaneCrystal']);
		CSWriteBool(NewSave['Flags']['GalaxyPearl']);
		CSWriteBool(NewSave['Flags']['GummyWorm']);
		CSWriteBool(NewSave['Flags']['Ambrosia']);
		CSWriteBool(NewSave['Flags']['DefeatedOOA']);
		CSWriteSInt32(NewSave['Stats']['TaxMoney']);
		CSWriteSInt32(NewSave['Stats']['PVEDeaths']);
		CSWriteSInt32(NewSave['Stats']['PVPDeaths']);
		CSWriteRGB(NewSave['Appearance']['HairColor']);
		CSWriteRGB(NewSave['Appearance']['SkinColor']);
		CSWriteRGB(NewSave['Appearance']['EyeColor']);
		CSWriteRGB(NewSave['Appearance']['ShirtColor']);
		CSWriteRGB(NewSave['Appearance']['UndershirtColor']);
		CSWriteRGB(NewSave['Appearance']['PantsColor']);
		CSWriteRGB(NewSave['Appearance']['ShoeColor']);
		for (const x in NewSave['Armor']) {
			WriteItemID(NewSave['Armor'][x]['ID']);
			WritePrefixID(NewSave['Armor'][x]['Prefix']);
		}
		for (const x in NewSave['Dye']) {
			WriteItemID(NewSave['Dye'][x]['ID']);
			WritePrefixID(NewSave['Dye'][x]['Prefix']);
		}
		for (const x in NewSave['Inventory']) {
			WriteItemID(NewSave['Inventory'][x]['ID']);
			CSWriteSInt32(NewSave['Inventory'][x]['Count']);
			WritePrefixID(NewSave['Inventory'][x]['Prefix']);
			CSWriteBool(NewSave['Inventory'][x]['Favorite']);
		}
		for (const x in NewSave['MiscEquip']) {
			WriteItemID(NewSave['MiscEquip'][x]['ID']);
			WritePrefixID(NewSave['MiscEquip'][x]['Prefix']);
			WriteItemID(NewSave['MiscEquip'][x]['Dye']['ID']);
			WritePrefixID(NewSave['MiscEquip'][x]['Dye']['Prefix']);
		}
		for (const x in NewSave['Bank']) {
			WriteItemID(NewSave['Bank'][x]['ID']);
			CSWriteSInt32(NewSave['Bank'][x]['Count']);
			WritePrefixID(NewSave['Bank'][x]['Prefix']);
		}
		for (const x in NewSave['Bank2']) {
			WriteItemID(NewSave['Bank2'][x]['ID']);
			CSWriteSInt32(NewSave['Bank2'][x]['Count']);
			WritePrefixID(NewSave['Bank2'][x]['Prefix']);
		}
		for (const x in NewSave['Bank3']) {
			WriteItemID(NewSave['Bank3'][x]['ID']);
			CSWriteSInt32(NewSave['Bank3'][x]['Count']);
			WritePrefixID(NewSave['Bank3'][x]['Prefix']);
		}
		for (const x in NewSave['Bank4']) {
			WriteItemID(NewSave['Bank4'][x]['ID']);
			CSWriteSInt32(NewSave['Bank4'][x]['Count']);
			WritePrefixID(NewSave['Bank4'][x]['Prefix']);
			CSWriteBool(NewSave['Inventory'][x]['Favorite']);
		}
		CSWriteByte(NewSave['VoidVaultInfo']);
		for (const x in NewSave['Buffs']) {
			CSWriteSInt32(NewSave['Buffs'][x]['ID']);
			CSWriteSInt32(NewSave['Buffs'][x]['Duration']);
		}
		for (const x in NewSave['Spawnpoint']) {
			CSWriteSInt32(NewSave['Spawnpoint'][x]['spX']);
			CSWriteSInt32(NewSave['Spawnpoint'][x]['spY']);
			CSWriteSInt32(NewSave['Spawnpoint'][x]['spI']);
			CSWriteString(NewSave['Spawnpoint'][x]['spN']);
		}
		if (NewSave['Spawnpoint'].length < 200) {
			CSWriteSInt32(-1);
		}
		CSWriteBool(NewSave['Flags']['HBLocked']);
		for (const x in NewSave['HideInfo']) {
			CSWriteBool(NewSave['HideInfo'][x]);
		}
		CSWriteSInt32(NewSave['AnglerQuestCount']);
		for (const x in NewSave['DPadBinding']) {
			CSWriteSInt32(NewSave['DPadBinding'][x]);
		}
		for (const x in NewSave['BuilderAccStatus']) {
			CSWriteSInt32(NewSave['BuilderAccStatus'][x]);
		}
		CSWriteSInt32(NewSave['TavernQuestCount']);
		CSWriteBool(NewSave['DeadStatus']['IsDead']);
		if (NewSave['DeadStatus']['IsDead'] == true) {
			CSWriteSInt32(NewSave['DeadStatus']['RespawnTimer']);
		}
		CSWriteSInt64(NewSave['LastSaved']);
		CSWriteSInt32(NewSave['GolfScore']);
		
		const Unknown = Buffer.from(NewSave['Unknown'], 'base64');
		const Final = Buffer.concat([Temp.slice(0, Onset), Unknown], Onset + Unknown.length);
		return Final;
	}
}

ParseFile();
fs.writeFileSync('./Player.json', JSON.stringify(Save, null, 2));
// Wait for input
(function () {
	const rl = require('readline').createInterface({
	    input: process.stdin,
	    output: process.stdout,
	});
	rl.question('Press enter when finished with edits.', (Waited) => {
		const NewSave = JSON.parse(fs.readFileSync('./Player.json'));
		fs.unlinkSync('./Player.json');
		const Serialized = SerializeFile(NewSave);
		fs.writeFileSync(process.argv[2], Buffer.from(Cipher.encrypt(Serialized, 128, CryptKey)))
		rl.close();
	})
})();

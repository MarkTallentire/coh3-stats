// type description of mapped data

import { resolveLocstring } from "./locstring";
import { traverseTree } from "./unitStatsLib";

// need to be extended by all required fields
type SbpsType = {
  id: string; // filename  -> eg. panzergrenadier_ak
  path: string; // folder from which the extraction got started. Eg. afrika_corps, american, british,.
  faction: string; // races\[factionName]
  loadout: LoadoutData[]; // squad_loadout_ext.unit_list
  /** Found at `squad_ui_ext.race_list`. */
  ui: SquadUiData;
  /** Found at `squad_upgrade_ext.upgrades`. List of instance references. */
  upgrades: string[];
  unitType: string;
};

type SquadUiData = {
  /* Icon paths in-game. */
  iconName: string; // Could be empty.
  symbolIconName: string; // Could be empty.
  /* Locstring fields. Found at `sbpextensions\\squad_ui_ext`. */
  helpText: string;
  briefText: string;
  screenName: string;
  extraText: string; // Could be empty (Set as $0).
};

type LoadoutData = {
  isDefaultUnit: boolean;
  num: number;
  type: string;
};

// exported variable holding mapped data for each
// json file. Will be set via setSbpsStats.
// Can be accessed from everywhere
let sbpsStats: SbpsType[];

// mapping a single entity of the json file. eg. panzergrenadier_ak.
// subtree -> eg. extensions node
const mapSbpsData = (filename: string, subtree: any, jsonPath: string, parent: string) => {
  const sbpsEntity: SbpsType = {
    id: filename,
    path: jsonPath,
    faction: jsonPath.split("\\")[1] ?? jsonPath,
    unitType: parent,
    loadout: [],
    ui: {
      iconName: "",
      symbolIconName: "",
      helpText: "",
      briefText: "",
      screenName: "",
      extraText: "",
    },
    upgrades: [],
  };

  mapExtensions(subtree, sbpsEntity);

  // compute load out

  return sbpsEntity;
};

const mapExtensions = (root: any, spbps: SbpsType) => {
  for (const squadext in root.extensions) {
    const extension = root.extensions[squadext].squadexts;
    const extName = extension.template_reference.value.split("\\")[1];
    switch (extName) {
      case "squad_loadout_ext":
        for (const unit in extension.unit_list) {
          // The serializer will transform the missing field as "undefined". For
          // better check, let's assign it as `-1`.
          let unitNum: number = extension.unit_list[unit].loadout_data.num || -1;
          // Workaround as long as the JSON is not complete. We will validate by unitType.
          if (unitNum === -1) {
            switch (spbps.unitType) {
              // Vehicles are always 1.
              case "vehicles":
              case "armored_tractor_254_ak_signals_sp":
                unitNum = 1;
                break;
              // Team weapons and infantry usually varies. Lets set as 4 by now.
              case "infantry":
              case "team_weapons":
                unitNum = 4;
              // Other stuff as 5.
              default:
                unitNum = 5;
                break;
            }
          }

          if (extension.unit_list[unit].loadout_data.type)
            spbps.loadout.push({
              isDefaultUnit: true,
              num: unitNum, //@todo num not always avilable
              type: extension.unit_list[unit].loadout_data.type.instance_reference,
            });
          else console.log("hmm");
        }
        break;
      case "squad_ui_ext":
        {
          // Check if the `race_list` is not empty, otherwise skip.
          if (!extension.race_list?.length) break;
          // The race_list is always one item.
          const uiExtInfo = extension.race_list[0].race_data.info;
          spbps.ui.iconName = uiExtInfo?.icon_name || "";
          spbps.ui.symbolIconName = uiExtInfo?.symbol_icon_name || "";
          // When it is empty, it has a value of "0".
          const screenName = uiExtInfo.screen_name;
          spbps.ui.screenName = resolveLocstring(screenName);
          const helpText = uiExtInfo.help_text;
          spbps.ui.helpText = resolveLocstring(helpText);
          const extraText = uiExtInfo.extra_text;
          spbps.ui.extraText = resolveLocstring(extraText);
          const briefText = uiExtInfo.brief_text;
          spbps.ui.briefText = resolveLocstring(briefText);
        }
        break;
      case "squad_upgrade_ext":
        // Check if the `upgrades` is not empty, otherwise skip.
        if (!extension.upgrades?.length) break;
        for (const upg of extension.upgrades) {
          if (upg.upgrade?.instance_reference) {
            spbps.upgrades.push(upg.upgrade.instance_reference);
          }
        }
        break;
      default:
        break;
    }
  }
};

// calls the mapping for each entity and
// puts the result array into the exported SbpsData variable.
// This variable can be imported everywhere.
// this method is called after loading the JSON at build time.
const getSbpsStats = async () => {
  // check if data already extracted
  if (sbpsStats) return sbpsStats;

  const myReqSbps = await fetch(
    "https://raw.githubusercontent.com/cohstats/coh3-data/xml-data/scripts/xml-to-json/exported/sbps.json",
  );

  const root = await myReqSbps.json();

  const sbpsSetAll: SbpsType[] = [];

  // Extract from JSON
  for (const obj in root) {
    // find all weapon_bags
    const sbpsSet = traverseTree(root[obj], isExtensionContainer, mapSbpsData, obj, obj);

    // Filter relevant objects
    sbpsSet.forEach((item: SbpsType) => {
      // filter by relevant weapon types
      // if (item.id === "panzer_iv_ger") {
      //   console.log("🚀 ~ file: mappingSbps.ts:144 ~ sbpsSet.forEach ~ item:", item)
      // }
      switch (item.unitType) {
        case "infantry": // General infantry.
        case "pathfinder_us": // USF Airborne infantry.
        case "team_weapons": // MGs, artillery (the mobile ones).
        case "armored_tractor_254_ak_signals_sp": // Things like the Marder III.
        case "greyhound_recrewable_us": // USF Vehicles
        case "halftrack_recrewable_ger": // German kettenrad and such.
        case "l6_40_recrewable_ger": // German tanks, wtf?
        case "vehicles": // General vehicles (tanks, armoured cars).
          sbpsSetAll.push(item);
          break;
        default:
          return;
      }
    });
  }

  //@todo to be filled
  return sbpsSetAll;
};

const isExtensionContainer = (key: string, obj: any) => {
  // check if first child is weapon_bag
  return Object.keys(obj)[0] === "extensions";
};

//
const setSbpsStats = (stats: SbpsType[]) => {
  //@todo to be filled
  sbpsStats = stats;
};

export { sbpsStats, setSbpsStats, getSbpsStats };
export type { SbpsType };

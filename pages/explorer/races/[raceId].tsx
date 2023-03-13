import { GetStaticPaths, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { Card, Container, Flex, Image, Stack, Text, Title } from "@mantine/core";
import { localizedNames } from "../../../src/coh3/coh3-data";
import { raceType } from "../../../src/coh3/coh3-types";
import {
  BuildingCard,
  BuildingSchema,
} from "../../../components/unit-cards/building-description-card";
import { fetchLocstring } from "../../../src/unitStats/locstring";
import { EbpsType, getEbpsStats } from "../../../src/unitStats/mappingEbps";
import { SbpsType, getSbpsStats } from "../../../src/unitStats/mappingSbps";
import { UpgradesType, getUpgradesStats } from "../../../src/unitStats/mappingUpgrades";
import { WeaponType, getWeaponStats } from "../../../src/unitStats/mappingWeapon";
import { BuildingType } from "../../../src/coh3";
import { getSquadTotalCost } from "../../../src/unitStats";

const RaceBagDescription: Record<raceType, string> = {
  // Locstring value: $11234530
  german:
    "A steadfast and elite force that can hold against even the most stubborn foe. Unlock unique arsenals to specialize your forces.",
  // Locstring value: $11234529
  american:
    "Versatile infantry and weaponry that can displace any opponent. Experience is key to improving your forces for the fight ahead.",
  // Locstring value: $11220490
  dak: "A combined-arms force of aggressive vehicles, plentiful reinforcements and stubborn tanks that can break down any enemy line.",
  // Locstring value: $11234532
  british:
    "Infantry and team weapons form a backbone that is tough to break. Myriad vehicles will create the opening you need to seize the day.",
};

interface RaceDetailProps {
  weaponData: WeaponType[];
  sbpsData: SbpsType[];
  ebpsData: EbpsType[];
  upgradesData: UpgradesType[];
  locstring: Record<string, string>;
}

const RaceDetail: NextPage<RaceDetailProps> = ({ ebpsData, sbpsData }) => {
  // The `query` contains the `raceId`, which is the filename as route slug.
  const { query } = useRouter();

  const raceToFetch: raceType = (query.raceId as raceType) || "american";
  const localizedRace = localizedNames[raceToFetch];
  const iconFaction = raceToFetch === "dak" ? "afrika_korps" : raceToFetch;

  return (
    <>
      <Head>
        <title>{localizedRace} - COH3 Explorer</title>
        <meta name="description" content={`${localizedRace} - COH3 Explorer`} />
      </Head>
      <Container size="md">
        <Stack>
          <Flex direction="row" align="center" gap="md">
            <Image
              height={64}
              width={64}
              fit="contain"
              src={`/icons/common/races/${iconFaction}.png`}
              alt={localizedRace}
            />
            <Title order={2}>{localizedRace}</Title>
          </Flex>

          <Text size="lg">{RaceBagDescription[raceToFetch]}</Text>
        </Stack>

        {/* Buildings Section */}
        <Stack mt={32}>
          <Title order={4}>Buildings</Title>
          <Text>This is an example building card list.</Text>

          {BuildingMapping(iconFaction, { ebpsData, sbpsData })}
        </Stack>
      </Container>
    </>
  );
};

const BuildingMapping = (
  race: "german" | "american" | "british" | "afrika_korps",
  data: { ebpsData: EbpsType[]; sbpsData: SbpsType[] },
) => {
  // Filter by faction (dak, german, uk, us), unit type (production buildings).
  const preFilteredBuildings = data.ebpsData.filter(
    (entity) => entity.faction === race && entity.unitType === "production",
  );
  // Filter invisible or unused buildings in multiplayer.
  const filteredBuildings = preFilteredBuildings.filter((building) => {
    switch (race) {
      // For DAK, buildings `halftrack_deployment_ak` and `heavy_weapon_kompanie_ak`.
      case "afrika_korps":
        return !["halftrack_deployment_ak", "heavy_weapon_kompanie_ak"].includes(building.id);
      // For American, the safe house of partisans (maybe campaign only).
      case "american":
        return !["safe_house_partisan"].includes(building.id);
      default:
        return true;
    }
  });
  // Sort like in-game menu (no idea how to simplify it).
  const sortedBuildings = [
    ...filteredBuildings.filter((x) => x.unitTypes.includes("support_center")),
    ...filteredBuildings.filter((x) => x.unitTypes.includes("hq")),
    ...filteredBuildings.filter((x) => x.unitTypes.includes("production1")),
    ...filteredBuildings.filter((x) => x.unitTypes.includes("production2")),
    ...filteredBuildings.filter((x) => x.unitTypes.includes("production3")),
    ...filteredBuildings.filter((x) => x.unitTypes.includes("production4")),
  ];
  console.log("🚀 ~ file: [raceId].tsx:115 ~ sortedBuildings:", sortedBuildings);
  return (
    <>
      {sortedBuildings.map((building) => (
        <Card key={building.id} p="sm" radius="md" withBorder>
          <BuildingCard
            // @todo: Validate types.
            types={building.unitTypes as BuildingType[]}
            desc={{
              screen_name: building.ui.screenName,
              help_text: building.ui.helpText,
              extra_text: building.ui.extraText,
              brief_text: building.ui.briefText,
              icon_name: building.ui.iconName,
              symbol_icon_name: building.ui.symbolIconName,
            }}
            units={getBuildingTrainableUnits(building, data.sbpsData, data.ebpsData)}
            upgrades={[]}
            time_cost={{
              fuel: building.cost.fuel,
              munition: building.cost.munition,
              manpower: building.cost.manpower,
              popcap: building.cost.popcap,
              time_seconds: building.cost.time,
            }}
            health={{
              hitpoints: building.health.hitpoints,
            }}
          ></BuildingCard>
        </Card>
      ))}
    </>
  );
};

function getBuildingTrainableUnits(
  building: EbpsType,
  sbpsData: SbpsType[],
  ebpsData: EbpsType[],
) {
  const trainableUnits: BuildingSchema["units"] = [];
  console.group(`Building ${building.id} - Squad Total Cost List`);
  for (const unitRef of building.spawnItems) {
    // Get the last element of the array, which is the id.
    const unitId = unitRef.split("/").slice(-1)[0];
    // console.log("🚀 ~ file: [raceId].tsx:151 ~ unitId:", unitId)
    const sbpsUnitFound = sbpsData.find((x) => x.id === unitId);
    // console.log("🚀 ~ file: [raceId].tsx:153 ~ sbpsUnitFound:", sbpsUnitFound)
    // Ignore those units not found.
    if (!sbpsUnitFound) continue;
    // Map the required fields.
    const totalCost = getSquadTotalCost(sbpsUnitFound, ebpsData);
    const unitInfo: BuildingSchema["units"][number] = {
      desc: {
        id: unitId,
        screen_name: sbpsUnitFound.ui.screenName,
        help_text: sbpsUnitFound.ui.helpText,
        brief_text: sbpsUnitFound.ui.briefText,
        symbol_icon_name: sbpsUnitFound.ui.symbolIconName,
        icon_name: sbpsUnitFound.ui.iconName,
      },
      time_cost: {
        fuel: totalCost.fuel,
        munition: totalCost.munition,
        manpower: totalCost.manpower,
        popcap: totalCost.popcap,
        time_seconds: totalCost.time,
      },
    };
    trainableUnits.push(unitInfo);
  }
  console.groupEnd();
  // console.log("🚀 ~ file: [raceId].tsx:162 ~ getBuildingTrainableUnits ~ trainableUnits:", trainableUnits)
  return trainableUnits;
}

// Generates `/dak`.
export const getStaticPaths: GetStaticPaths<{ raceId: string }> = async () => {
  return {
    paths: [
      { params: { raceId: "dak" } },
      { params: { raceId: "american" } },
      { params: { raceId: "british" } },
      { params: { raceId: "german" } },
    ],
    fallback: false, // can also be true or 'blocking'
  };
};

export const getStaticProps = async () => {
  const locstring = await fetchLocstring();

  // map Data at built time
  const weaponData = await getWeaponStats();

  // map Data at built time
  const ebpsData = await getEbpsStats();

  // map Data at built time
  const sbpsData = await getSbpsStats();

  // map Data at built time
  const upgradesData = await getUpgradesStats();

  return {
    props: {
      weaponData,
      sbpsData,
      ebpsData,
      upgradesData,
      locstring,
    },
  };
};

export default RaceDetail;

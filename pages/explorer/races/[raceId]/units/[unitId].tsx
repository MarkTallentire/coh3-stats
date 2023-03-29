import { GetStaticPaths, NextPage } from "next";
import Head from "next/head";
import Error from "next/error";
import { useRouter } from "next/router";
import { Card, Flex, Grid, List, Space, Stack, Text, Title } from "@mantine/core";
import ContentContainer from "../../../../../components/Content-container";
import {
  EbpsType,
  getResolvedUpgrades,
  getSquadTotalCost,
  getSquadTotalUpkeepCost,
  RaceBagDescription,
  SbpsType,
  UpgradesType,
  WeaponType,
} from "../../../../../src/unitStats";
import { UnitDescriptionCard } from "../../../../../components/unit-cards/unit-description-card";
import FactionIcon from "../../../../../components/faction-icon";
import { raceType } from "../../../../../src/coh3/coh3-types";
import { localizedNames } from "../../../../../src/coh3/coh3-data";
// import {
//   StatsVehicleArmor,
//   VehicleArmorType,
// } from "../../../../../components/unit-cards/vehicle-armor-card";
import { UnitCostCard } from "../../../../../components/unit-cards/unit-cost-card";
import { UnitUpgradeCard } from "../../../../../components/unit-cards/unit-upgrade-card";
import { VeterancyCard } from "../../../../../components/unit-cards/veterancy-card";
import { WeaponLoadoutCard } from "../../../../../components/unit-cards/weapon-loadout-card";
import { HitpointCard } from "../../../../../components/unit-cards/hitpoints-card";
import { UnitSquadCard } from "../../../../../components/unit-cards/unit-squad-card";
import slash from "slash";
import { getIconsPathOnCDN } from "../../../../../src/utils";
import { generateKeywordsString } from "../../../../../src/head-utils";
import { getMappings } from "../../../../../src/unitStats/mappings";
import { getSbpsWeapons, WeaponMember } from "../../../../../src/unitStats/dpsCommon";

interface UnitDetailProps {
  sbpsData: SbpsType[];
  ebpsData: EbpsType[];
  upgradesData: UpgradesType[];
  weaponsData: WeaponType[];
  locstring: Record<string, string>;
}

const UnitDetail: NextPage<UnitDetailProps> = ({
  sbpsData,
  ebpsData,
  upgradesData,
  weaponsData,
}) => {
  const { query } = useRouter();

  const unitId = query.unitId as string;
  const raceId = query.raceId as raceType;

  const resolvedSquad = sbpsData.find((x) => x.id === unitId);
  const resolvedEntities: EbpsType[] = [];

  for (const loadout of resolvedSquad?.loadout || []) {
    const id = loadout.type.split("/").slice(-1)[0];
    const foundEntity = ebpsData.find((x) => x.id === id);
    if (foundEntity) {
      resolvedEntities.push(foundEntity);
    }
  }

  // The resolved entity does not matter at all, as we can obtain such from the squad loadout.
  // console.log("🚀 ~ file: [unitId].tsx:35 ~ resolvedSquad:", resolvedSquad);
  // console.log("🚀 ~ file: [unitId].tsx:35 ~ resolvedEntities:", resolvedEntities);

  if (!resolvedSquad || !resolvedEntities?.length) {
    // How to redirect back?
    return <Error statusCode={404} title="Unit Not Found" />;
  }

  const localizedRace = localizedNames[raceId];
  const descriptionRace = RaceBagDescription[raceId];

  // For team_weapons, get default members.
  let defaultSquadMember: EbpsType;
  if (resolvedSquad.unitType === "team_weapons" && resolvedSquad.loadout.length > 1) {
    defaultSquadMember = resolvedEntities[resolvedEntities.length - 1];
  } else {
    defaultSquadMember = resolvedEntities[0];
  }

  // Only vehicles have armor values and a single entity usually. The infantry
  // uses the plain `armor`.
  const armorValues = {
    armor: defaultSquadMember.health.armorLayout.armor || 0,
    frontal: defaultSquadMember.health.armorLayout.frontArmor || 0,
    side: defaultSquadMember.health.armorLayout.sideArmor || 0,
    rear: defaultSquadMember.health.armorLayout.rearArmor || 0,
    targetSize: defaultSquadMember.health.targetSize || 0,
  };

  const sightValues = {
    coneAngle: defaultSquadMember.sight_ext.sight_package.cone_angle,
    outerRadius: defaultSquadMember.sight_ext.sight_package.outer_radius,
  };
  const movingValues = {
    defaultSpeed: defaultSquadMember.moving_ext.speed_scaling_table.default_speed,
    maxSpeed: defaultSquadMember.moving_ext.speed_scaling_table.max_speed,
  };

  // Obtain the total cost of the squad by looking at the loadout.
  const totalCost = getSquadTotalCost(resolvedSquad, ebpsData);

  // Obtain the total upkeep cost of the squad.
  const totalUpkeepCost = getSquadTotalUpkeepCost(resolvedSquad, ebpsData);

  // Obtain the squad weapons loadout (ignoring non-damage dealing ones like smoke).
  const squadWeapons = getSbpsWeapons(resolvedSquad, ebpsData, weaponsData);

  const metaKeywords = generateKeywordsString([
    `${resolvedSquad.ui.screenName} coh3`,
    `${resolvedSquad.ui.screenName} ${localizedRace}`,
    `${resolvedSquad.ui.screenName}`,
    `${resolvedSquad.ui.screenName} ${raceId}`,
  ]);

  return (
    <>
      <Head>
        <title>{`${resolvedSquad.ui.screenName} - COH3 Explorer`}</title>
        <meta name="description" content={`${resolvedSquad.ui.screenName} - COH3 Explorer`} />
        <meta name="keywords" content={metaKeywords} />
        <meta
          property="og:image"
          content={getIconsPathOnCDN(`/icons/${slash(resolvedSquad.ui.iconName)}.png`)}
        />
      </Head>
      <ContentContainer>
        <Space h={32}></Space>
        <Flex direction="row" align="center" gap="md">
          <FactionIcon name={raceId} width={96}></FactionIcon>
          <Stack spacing="xs">
            <Title order={4}>{localizedRace}</Title>
            <Text size="lg">{descriptionRace}</Text>
          </Stack>
        </Flex>
        <Space h={32}></Space>
        <Grid columns={3}>
          <Grid.Col span={3}>
            <Card p="lg" radius="md" withBorder>
              <UnitDescriptionCard
                screen_name={resolvedSquad.ui.screenName}
                help_text={resolvedSquad.ui.helpText}
                brief_text={resolvedSquad.ui.briefText}
                symbol_icon_name={resolvedSquad.ui.symbolIconName}
                icon_name={resolvedSquad.ui.iconName}
              ></UnitDescriptionCard>
            </Card>
          </Grid.Col>
          <Grid.Col md={2} order={2} orderMd={1}>
            <Stack>
              <Title order={4}>Stats</Title>
              <Card p="lg" radius="md" withBorder>
                {UnitSquadCard({
                  id: resolvedSquad.id,
                  type: resolvedSquad.unitType,
                  health: armorValues,
                  ui: {
                    armorIcon: resolvedSquad.ui.armorIcon,
                  },
                  sight: sightValues,
                  moving: movingValues,
                })}
              </Card>
              {UnitUpgradeSection(resolvedSquad, upgradesData)}
              {UnitWeaponSection(squadWeapons)}
            </Stack>
          </Grid.Col>
          <Grid.Col md={1} order={1} orderMd={2}>
            <Stack>
              <Title order={4}>Stats</Title>
              <Card p="lg" radius="md" withBorder>
                {UnitCostCard(totalCost)}
              </Card>
              <Card p="lg" radius="md" withBorder>
                {HitpointCard({ squad: resolvedSquad, entities: resolvedEntities })}
              </Card>
              <Card p="lg" radius="md" withBorder>
                {UnitCostCard(totalUpkeepCost, "Upkeep per minute")}
              </Card>
              <Card p="lg" radius="md" withBorder>
                <VeterancyCard
                  one={resolvedSquad.veterancyInfo.one}
                  two={resolvedSquad.veterancyInfo.two}
                  three={resolvedSquad.veterancyInfo.three}
                ></VeterancyCard>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </ContentContainer>
    </>
  );
};

const UnitUpgradeSection = (squad: SbpsType, upgradesData: UpgradesType[]) => {
  // Resolve unit upgrades.
  const upgrades = Object.values(getResolvedUpgrades(squad.upgrades, upgradesData));
  if (!upgrades.length) return <></>;
  return (
    <Stack>
      <Title order={4}>Upgrades</Title>
      <Stack>
        {Object.values(upgrades).map(({ id, ui, cost }) => {
          return (
            <Card key={id} p="lg" radius="md" withBorder>
              {UnitUpgradeCard({
                id,
                desc: {
                  screen_name: ui.screenName,
                  help_text: ui.helpText,
                  extra_text: ui.extraText,
                  brief_text: ui.briefText,
                  icon_name: ui.iconName,
                },
                time_cost: cost,
              })}
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
};

const UnitWeaponSection = (squadWeapons: WeaponMember[]) => {
  return (
    <Stack>
      <Title order={4}>Loadout</Title>

      <Grid columns={2} grow>
        {squadWeapons.map(({ weapon_id, weapon, num }) => {
          return (
            <Grid.Col span={1} key={weapon_id}>
              <Card p="lg" radius="md" withBorder>
                {WeaponLoadoutCard(weapon, num)}
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>

      {/* Section: Small notes for players */}

      <List size="xs">
        <List.Item>
          <Text color="orange.5">
            The effective accuracy is impacted by several factors like target size or armor of the
            receiving unit as well as accuracy or penetration of the attacking one.
          </Text>
        </List.Item>
      </List>
    </Stack>
  );
};

export const getStaticProps = async () => {
  const { locstring, ebpsData, sbpsData, upgradesData, weaponData } = await getMappings();

  return {
    props: {
      locstring,
      sbpsData,
      ebpsData,
      upgradesData,
      weaponsData: weaponData,
    },
  };
};

export const getStaticPaths: GetStaticPaths<{ unitId: string }> = async () => {
  return {
    paths: [], //indicates that no page needs be created at build time
    fallback: "blocking", //indicates the type of fallback
  };
};

export default UnitDetail;
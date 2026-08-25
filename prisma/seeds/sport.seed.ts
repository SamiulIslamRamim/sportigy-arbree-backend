import { prisma } from "../../src/config/prisma.js";
import { FieldSection, FieldType, FormulaRole } from "../../src/generated/prisma/client";

type FieldSeed = {
  name: string;
  slug: string;
  section: FieldSection;
  type: FieldType;
  required: boolean;
  searchable: boolean;
  filterable: boolean;
  sortable: boolean;
  displayOrder: number;
  metricSlug?: string;
  isComputed?: boolean;
  formulaMultiplier?: number;
  numeratorSlugs?: string[];
  denominatorSlugs?: string[];
  options?: {
    label: string;
    value: string;
  }[];
};

const cricketProfileFields: FieldSeed[] = [
  {
    name: "Playing Role",
    slug: "playing_role",
    section: FieldSection.PROFILE,
    type: FieldType.SELECT,
    required: true,
    searchable: true,
    filterable: true,
    sortable: true,
    displayOrder: 1,
    options: [
      { label: "Wicket Keeper", value: "wicket_keeper" },
      { label: "Batsman", value: "batsman" },
      { label: "Bowler", value: "bowler" },
      { label: "All Rounder", value: "all_rounder" },
    ],
  },
  {
    name: "Batting Style",
    slug: "batting_style",
    section: FieldSection.PROFILE,
    type: FieldType.SELECT,
    required: true,
    searchable: true,
    filterable: true,
    sortable: true,
    displayOrder: 2,
    options: [
      { label: "Right Hand Batsman", value: "right_hand_batsman" },
      { label: "Left Hand Batsman", value: "left_hand_batsman" },
    ],
  },
  {
    name: "Bowling Style",
    slug: "bowling_style",
    section: FieldSection.PROFILE,
    type: FieldType.SELECT,
    required: true,
    searchable: true,
    filterable: true,
    sortable: true,
    displayOrder: 3,
    options: [
      { label: "Right Hand Fast", value: "right_hand_fast" },
      { label: "Left Hand Fast", value: "left_hand_fast" },
      { label: "Right Hand Spin", value: "right_hand_spin" },
      { label: "Left Hand Spin", value: "left_hand_spin" },
      { label: "None", value: "none" },
    ],
  },
];

const footballProfileFields: FieldSeed[] = [
  {
    name: "Main Position",
    slug: "main_position",
    section: FieldSection.PROFILE,
    type: FieldType.SELECT,
    required: true,
    searchable: true,
    filterable: true,
    sortable: true,
    displayOrder: 1,
    options: [
      { label: "Goalkeeper", value: "goalkeeper" },
      { label: "Defender", value: "defender" },
      { label: "Midfielder", value: "midfielder" },
      { label: "Forward", value: "forward" },
    ],
  },
  {
    name: "Specific Position",
    slug: "specific_position",
    section: FieldSection.PROFILE,
    type: FieldType.SELECT,
    required: false,
    searchable: true,
    filterable: true,
    sortable: true,
    displayOrder: 2,
    options: [
      { label: "Center Back", value: "center_back" },
      { label: "Fullback", value: "fullback" },
      { label: "Central Midfielder", value: "central_midfielder" },
      { label: "Winger", value: "winger" },
      { label: "Striker", value: "striker" },
      { label: "None", value: "none" },
    ],
  },
  {
    name: "Preferred Foot",
    slug: "preferred_foot",
    section: FieldSection.PROFILE,
    type: FieldType.SELECT,
    required: true,
    searchable: true,
    filterable: true,
    sortable: true,
    displayOrder: 3,
    options: [
      { label: "Right Foot", value: "right_foot" },
      { label: "Left Foot", value: "left_foot" },
      { label: "Both", value: "both" },
    ],
  },
];

const cricketMatchFields: FieldSeed[] = [
  {
    name: "NO",
    slug: "not_outs",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 1,
    metricSlug: "batting",
  },
  {
    name: "Runs",
    slug: "total_runs",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 2,
    metricSlug: "batting",
  },
  {
    name: "HS",
    slug: "highest_score",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 3,
    metricSlug: "batting",
  },
  {
    name: "Ave",
    slug: "batting_average",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 4,
    metricSlug: "batting",
  },
  {
    name: "BF",
    slug: "balls_faced",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 5,
    metricSlug: "batting",
  },
  {
    name: "SR",
    slug: "strike_rate",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 6,
    isComputed: true,
    formulaMultiplier: 100,
    numeratorSlugs: ["total_runs"],
    denominatorSlugs: ["balls_faced"],
    metricSlug: "batting",
  },
  {
    name: "100s",
    slug: "hundreds",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 7,
    metricSlug: "batting",
  },
  {
    name: "50s",
    slug: "fifties",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 8,
    metricSlug: "batting",
  },
  {
    name: "4s",
    slug: "fours",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 9,
    metricSlug: "batting",
  },
  {
    name: "6s",
    slug: "sixes",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 10,
    metricSlug: "batting",
  },
  {
    name: "Ct",
    slug: "catches",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 11,
    metricSlug: "fielding",
  },
  {
    name: "St",
    slug: "stumpings",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 12,
    metricSlug: "fielding",
  },
  {
    name: "O",
    slug: "overs_bowled",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 13,
    metricSlug: "bowling",
  },
  {
    name: "W",
    slug: "wickets",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 14,
    metricSlug: "bowling",
  },
  {
    name: "Runs (Bowling)",
    slug: "runs_conceded",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 15,
    metricSlug: "bowling",
  },
  {
    name: "Econ",
    slug: "economy_rate",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 16,
    isComputed: true,
    formulaMultiplier: 6,
    numeratorSlugs: ["runs_conceded"],
    denominatorSlugs: ["overs_bowled"],
    metricSlug: "bowling",
  },
  {
    name: "5w",
    slug: "five_wickets",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 17,
    metricSlug: "bowling",
  },
];

const footballMatchFields: FieldSeed[] = [
  {
    name: "App",
    slug: "appearances",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 1,
    metricSlug: "general",
  },
  {
    name: "G",
    slug: "goals",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 2,
    metricSlug: "offensive",
  },
  {
    name: "A",
    slug: "assists",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 3,
    metricSlug: "offensive",
  },
  {
    name: "Mins",
    slug: "minutes_played",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 4,
    metricSlug: "general",
  },
  {
    name: "Sh",
    slug: "total_shots",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 5,
    metricSlug: "offensive",
  },
  {
    name: "SoT",
    slug: "shots_on_target",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 6,
    metricSlug: "offensive",
  },
  {
    name: "Pass %",
    slug: "pass_accuracy_percentage",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 7,
    metricSlug: "general",
  },
  {
    name: "Tkl",
    slug: "tackles_won",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 8,
    metricSlug: "defensive",
  },
  {
    name: "CS",
    slug: "clean_sheets",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 9,
    metricSlug: "goalkeeping",
  },
  {
    name: "GC",
    slug: "goals_conceded",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 10,
    metricSlug: "goalkeeping",
  },
  {
    name: "Saves",
    slug: "total_saves",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 11,
    metricSlug: "goalkeeping",
  },
  {
    name: "Save %",
    slug: "save_percentage",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 12,
    metricSlug: "goalkeeping",
  },
  {
    name: "Pen S",
    slug: "penalty_saves",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 13,
    metricSlug: "goalkeeping",
  },
  {
    name: "YC",
    slug: "yellow_cards",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 14,
    metricSlug: "general",
  },
  {
    name: "RC",
    slug: "red_cards",
    section: FieldSection.MATCH,
    type: FieldType.NUMBER,
    required: false,
    searchable: false,
    filterable: true,
    sortable: true,
    displayOrder: 15,
    metricSlug: "general",
  },
];

async function seedFields(sportId: string, fields: FieldSeed[]) {
  const fieldBySlug = new Map<string, string>();
  const metricBySport = sportMetricBySlug.get(sportId) ?? new Map<string, string>();

  for (const field of fields) {
    const metricId = field.metricSlug ? metricBySport.get(field.metricSlug) ?? null : null;
    const isComputed = field.isComputed ?? false;

    const createdField = await prisma.sportField.upsert({
      where: {
        sportId_section_slug: {
          sportId,
          section: field.section,
          slug: field.slug,
        },
      },
      update: {
        name: field.name,
        type: field.type,
        required: isComputed ? false : field.required,
        searchable: field.searchable,
        filterable: field.filterable,
        sortable: field.sortable,
        displayOrder: field.displayOrder,
        isComputed,
        formulaMultiplier: field.formulaMultiplier ?? null,
        metricId,
        isActive: true,
      },
      create: {
        sportId,
        name: field.name,
        slug: field.slug,
        section: field.section,
        type: field.type,
        required: isComputed ? false : field.required,
        searchable: field.searchable,
        filterable: field.filterable,
        sortable: field.sortable,
        displayOrder: field.displayOrder,
        isComputed,
        formulaMultiplier: field.formulaMultiplier ?? null,
        metricId,
      },
    });

    fieldBySlug.set(field.slug, createdField.id);

    if (field.options) {
      for (const option of field.options) {
        await prisma.sportFieldOption.upsert({
          where: {
            fieldId_value: {
              fieldId: createdField.id,
              value: option.value,
            },
          },
          update: {
            label: option.label,
            isActive: true,
          },
          create: {
            fieldId: createdField.id,
            label: option.label,
            value: option.value,
          },
        });
      }
    }
  }

  // Computed fields need their formula components wired after every source
  // field exists (source fields are plain MATCH NUMBER fields in the same sport).
  for (const field of fields) {
    if (!field.isComputed) continue;
    const computedFieldId = fieldBySlug.get(field.slug);
    if (!computedFieldId) continue;

    const components: { computedFieldId: string; sourceFieldId: string; role: FormulaRole }[] = [];
    for (const sourceSlug of field.numeratorSlugs ?? []) {
      const sourceFieldId = fieldBySlug.get(sourceSlug);
      if (sourceFieldId) components.push({ computedFieldId, sourceFieldId, role: FormulaRole.NUMERATOR });
    }
    for (const sourceSlug of field.denominatorSlugs ?? []) {
      const sourceFieldId = fieldBySlug.get(sourceSlug);
      if (sourceFieldId) components.push({ computedFieldId, sourceFieldId, role: FormulaRole.DENOMINATOR });
    }

    for (const c of components) {
      await prisma.sportFieldFormulaComponent.upsert({
        where: {
          computedFieldId_sourceFieldId_role: {
            computedFieldId: c.computedFieldId,
            sourceFieldId: c.sourceFieldId,
            role: c.role,
          },
        },
        update: {},
        create: c,
      });
    }
  }
}

async function seedMetrics(sportId: string, metrics: { name: string; slug: string; displayOrder: number }[]) {
  for (const m of metrics) {
    const metric = await prisma.sportMetric.upsert({
      where: { sportId_slug: { sportId, slug: m.slug } },
      update: { name: m.name, displayOrder: m.displayOrder, isActive: true },
      create: { sportId, name: m.name, slug: m.slug, displayOrder: m.displayOrder },
    });
    // Keep a slug -> id lookup for the seeding pass that assigns metricId to fields.
    (sportMetricBySlug.get(sportId) ?? sportMetricBySlug.set(sportId, new Map()).get(sportId)!).set(m.slug, metric.id);
  }
}

// sportId -> (metricSlug -> metricId), populated during seedMetrics so seedFields
// can resolve metricSlug to a real metric id.
const sportMetricBySlug = new Map<string, Map<string, string>>();

async function seedCategories(
  sportId: string,
  categories: string[],
) {
  for (const name of categories) {
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    await prisma.sportCategory.upsert({
      where: {
        sportId_slug: {
          sportId,
          slug,
        },
      },
      update: {
        name,
        isActive: true,
      },
      create: {
        sportId,
        name,
        slug,
      },
    });
  }
}

export async function seedSports() {
  console.log("Seeding sports...");

  const football = await prisma.sport.upsert({
    where: {
      slug: "football",
    },
    update: {
      name: "Football",
      description: "Football sport",
      isActive: true,
    },
    create: {
      name: "Football",
      slug: "football",
      description: "Football sport",
      isActive: true,
    },
  });

  const cricket = await prisma.sport.upsert({
    where: {
      slug: "cricket",
    },
    update: {
      name: "Cricket",
      description: "Cricket sport",
      isActive: true,
    },
    create: {
      name: "Cricket",
      slug: "cricket",
      description: "Cricket sport",
      isActive: true,
    },
  });

  await seedCategories(football.id, [
    "Friendly",
    "Knockout",
    "League",
  ]);

  await seedCategories(cricket.id, [
    "T20",
    "ODI",
    "TEST"
  ]);

  await seedMetrics(football.id, [
    { name: "Offensive", slug: "offensive", displayOrder: 1 },
    { name: "Goalkeeping", slug: "goalkeeping", displayOrder: 2 },
    { name: "General", slug: "general", displayOrder: 3 },
  ]);

  await seedMetrics(cricket.id, [
    { name: "Batting", slug: "batting", displayOrder: 1 },
    { name: "Bowling", slug: "bowling", displayOrder: 2 },
    { name: "Fielding", slug: "fielding", displayOrder: 3 },
  ]);

  await seedFields(football.id, [
    ...footballProfileFields,
    ...footballMatchFields,
  ]);

  await seedFields(cricket.id, [
    ...cricketProfileFields,
    ...cricketMatchFields,
  ]);

  console.log("Sports seeded successfully!");
}
import { prisma } from "../../src/config/prisma";
import { FieldSection, FieldType } from "../../src/generated/prisma/client";

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
  },
];

async function seedFields(sportId: string, fields: FieldSeed[]) {
  for (const field of fields) {
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
        required: field.required,
        searchable: field.searchable,
        filterable: field.filterable,
        sortable: field.sortable,
        displayOrder: field.displayOrder,
        isActive: true,
      },
      create: {
        sportId,
        name: field.name,
        slug: field.slug,
        section: field.section,
        type: field.type,
        required: field.required,
        searchable: field.searchable,
        filterable: field.filterable,
        sortable: field.sortable,
        displayOrder: field.displayOrder,
      },
    });

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
}

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
import { prisma } from "../../src/config/prisma";
import {
  ApprovalStatus,
  FieldSection,
  FieldType,
  MatchResult,
  PlayerSide,
} from "../../src/generated/prisma/client";

const PLAYER_USER_ID = "01221197-a625-4987-9360-e88d4b179d7b";
const SPORT_SLUG = "cricket";

const TEAMS = [
  "Dhaka Warriors",
  "Chattogram Kings",
  "Khulna Titans",
  "Rajshahi Royals",
  "Sylhet Strikers",
  "Barishal Bulls",
] as const;

const VENUES = [
  "Sher-e-Bangla National Stadium, Mirpur",
  "Zahur Ahmed Chowdhury Stadium, Chattogram",
  "Sylhet International Stadium",
  "Khan Shaheb Osman Ali Stadium, Narayanganj",
  "Sheikh Abu Naser Stadium, Khulna",
] as const;

type FormatConfig = {
  categorySlug: string;
  count: number;
  tournament: string;
  matchType: string;
  maxRuns: number;
  runsPerBall: number;
  maxOvers: number;
  economyBase: number;
};

const FORMATS: FormatConfig[] = [
  { categorySlug: "odi", count: 20, tournament: "National ODI Cup 2026", matchType: "ODI", maxRuns: 140, runsPerBall: 0.92, maxOvers: 10, economyBase: 4.8 },
  { categorySlug: "t20", count: 10, tournament: "Premier T20 League 2026", matchType: "T20", maxRuns: 95, runsPerBall: 1.32, maxOvers: 4, economyBase: 7.4 },
  { categorySlug: "test", count: 10, tournament: "First-Class Test Series 2026", matchType: "TEST", maxRuns: 175, runsPerBall: 0.52, maxOvers: 26, economyBase: 3.1 },
];

const mulberry32 = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = <T>(items: readonly T[], rng: () => number): T =>
  items[Math.floor(rng() * items.length)] ?? (items[0] as T);

const matchIdFor = (n: number): string =>
  `a1b2c3d4-0000-4000-8000-${String(n).padStart(12, "0")}`;

const buildStatLine = (
  rng: () => number,
  cfg: FormatConfig,
): Record<string, number> => {
  const line: Record<string, number> = {};

  if (rng() < 0.9) {
    const runs = Math.floor(rng() * cfg.maxRuns);
    line.not_outs = rng() < 0.15 ? 1 : 0;
    line.total_runs = runs;
    line.highest_score = runs;
    line.balls_faced =
      runs === 0
        ? Math.floor(rng() * 8)
        : Math.max(1, Math.round(runs / cfg.runsPerBall));
    line.hundreds = runs >= 100 ? 1 : 0;
    line.fifties = runs >= 50 && runs < 100 ? 1 : 0;
    line.fours = Math.floor(runs / 8);
    line.sixes = Math.floor(runs / 30);
  }

  if (rng() < 0.55) {
    const oversInt = Math.floor(rng() * cfg.maxOvers);
    const ballPart = Math.floor(rng() * 6) * 0.1;
    const overs = Number((oversInt + ballPart).toFixed(1));
    const totalBalls = oversInt * 6 + Math.round(ballPart * 10);
    const wicketRoll = rng();
    const wickets =
      wicketRoll < 0.4 ? 0 : wicketRoll < 0.7 ? 1 : wicketRoll < 0.88 ? 2 : wicketRoll < 0.96 ? 3 : wicketRoll < 0.995 ? 4 : 5;
    line.overs_bowled = overs;
    line.wickets = wickets;
    line.runs_conceded = Math.round((totalBalls * (cfg.economyBase + rng() * 3.5)) / 6);
    line.five_wickets = wickets === 5 ? 1 : 0;
  }

  if (rng() < 0.8) {
    line.catches = Math.floor(rng() * 2.4);
    line.stumpings = rng() < 0.07 ? 1 : 0;
  }

  return line;
};

export async function seedCricketMatches(): Promise<void> {
  console.log("Seeding cricket player matches...");

  const user = await prisma.user.findUnique({
    where: { id: PLAYER_USER_ID },
    select: { id: true },
  });
  if (!user) throw new Error(`Seed user not found: ${PLAYER_USER_ID}`);

  const sport = await prisma.sport.findUnique({
    where: { slug: SPORT_SLUG },
    select: { id: true },
  });
  if (!sport) throw new Error("Cricket sport not found. Run the sport seed first.");

  const categories = await prisma.sportCategory.findMany({
    where: { sportId: sport.id },
    select: { id: true, slug: true },
  });
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const fields = await prisma.sportField.findMany({
    where: {
      sportId: sport.id,
      section: FieldSection.MATCH,
      type: FieldType.NUMBER,
      isComputed: false,
      isActive: true,
    },
    select: { id: true, slug: true },
  });
  const fieldIdBySlug = new Map(fields.map((f) => [f.slug, f.id]));

  const admin = await prisma.admin.findUnique({
    where: { username: "admin" },
    select: { id: true },
  });

  const rng = mulberry32(20260824);
  const myTeam = TEAMS[0] as string;
  const opponents = TEAMS.slice(1);
  let seq = 1000;

  for (const cfg of FORMATS) {
    const categoryId = categoryIdBySlug.get(cfg.categorySlug);
    if (!categoryId) {
      throw new Error(`Missing cricket category slug "${cfg.categorySlug}". Run the sport seed first.`);
    }

    for (let i = 0; i < cfg.count; i++) {
      seq += 1;
      const id = matchIdFor(seq);
      const opponent = pick(opponents, rng);
      const playerSide = rng() < 0.5 ? PlayerSide.HOME : PlayerSide.AWAY;
      const homeTeam = playerSide === PlayerSide.HOME ? myTeam : opponent;
      const awayTeam = playerSide === PlayerSide.HOME ? opponent : myTeam;
      const resultPool: MatchResult[] =
        cfg.matchType === "TEST"
          ? [MatchResult.WIN, MatchResult.LOSS, MatchResult.DRAW]
          : [MatchResult.WIN, MatchResult.LOSS, MatchResult.NO_RESULT];
      const matchDate = new Date(
        Date.now() -
          (seq - 1000) * 11 * 24 * 3600 * 1000 -
          Math.floor(rng() * 5) * 24 * 3600 * 1000,
      );

      const data = {
        sportCategoryId: categoryId,
        title: `${homeTeam} vs ${awayTeam}`,
        tournament: cfg.tournament,
        matchType: cfg.matchType,
        venue: pick(VENUES, rng),
        homeTeam,
        awayTeam,
        playerSide,
        matchDate,
        result: pick(resultPool, rng),
        isCaptain: seq % 7 === 0,
        isSubstitute: false,
        status: ApprovalStatus.APPROVED,
        reviewedBy: admin?.id ?? null,
        reviewedAt: new Date(matchDate.getTime() + 24 * 3600 * 1000),
      };

      await prisma.playerMatch.upsert({
        where: { id },
        update: data,
        create: { id, userId: PLAYER_USER_ID, sportId: sport.id, ...data },
      });

      const line = buildStatLine(rng, cfg);
      for (const [slug, value] of Object.entries(line)) {
        const fieldId = fieldIdBySlug.get(slug);
        if (!fieldId) continue;
        await prisma.playerMatchFieldValue.upsert({
          where: { playerMatchId_fieldId: { playerMatchId: id, fieldId } },
          update: { valueNumber: value, optionId: null },
          create: { playerMatchId: id, fieldId, valueNumber: value },
        });
      }
    }
  }

  console.log(`Seeded ${seq - 1000} cricket matches for user ${PLAYER_USER_ID}.`);
}
import { NextRequest, NextResponse } from 'next/server';
import { routeLLMClient } from '@/lib/routellm';

export const dynamic = 'force-dynamic';

// Curated fallback tropes by genre family for when LLM is unavailable
const FALLBACK_TROPES: Record<string, Array<{ name: string; description: string; popularity: number }>> = {
  romance: [
    { name: 'Enemies to Lovers', description: 'Two characters who start off hating each other gradually fall in love through forced proximity or shared goals.', popularity: 98 },
    { name: 'Second Chance Romance', description: 'Former lovers reunite after years apart, dealing with old wounds and rekindled passion.', popularity: 95 },
    { name: 'Fake Dating', description: 'Two people pretend to be in a relationship for mutual benefit, only to develop real feelings.', popularity: 94 },
    { name: 'Friends to Lovers', description: 'Long-time friends slowly realize their feelings run deeper than friendship.', popularity: 93 },
    { name: 'Forbidden Love', description: 'Lovers must navigate societal, familial, or professional barriers that keep them apart.', popularity: 92 },
    { name: 'Grumpy/Sunshine', description: 'A cheerful optimist melts the heart of a brooding, cynical character.', popularity: 96 },
    { name: 'Forced Proximity', description: 'Characters are trapped together — snowed in, road trip, one bed — and sparks fly.', popularity: 95 },
    { name: 'Marriage of Convenience', description: 'A practical arrangement turns into genuine love as the couple discovers unexpected compatibility.', popularity: 89 },
    { name: 'Love Triangle', description: 'A protagonist torn between two compelling romantic interests with different qualities.', popularity: 87 },
    { name: 'Slow Burn', description: 'Romance builds gradually over a long period, with simmering tension and delayed gratification.', popularity: 97 },
    { name: 'Secret Identity', description: 'One lover has a hidden identity or double life that complicates the relationship.', popularity: 85 },
    { name: 'Billionaire Romance', description: 'A wealthy, powerful love interest sweeps the protagonist into a glamorous but complicated world.', popularity: 88 },
    { name: 'Workplace Romance', description: 'Love blooms between colleagues or a boss and employee, risking their professional lives.', popularity: 90 },
    { name: 'Soulmates / Fated Mates', description: 'A destined connection draws two people together despite all obstacles.', popularity: 91 },
    { name: 'Opposites Attract', description: 'Two people with vastly different personalities, backgrounds, or lifestyles find unexpected chemistry.', popularity: 89 },
    { name: 'Single Parent Romance', description: 'A single parent finds love again while balancing the needs of their children.', popularity: 86 },
    { name: 'Amnesia Romance', description: 'One character loses their memory, and the couple must rediscover their love.', popularity: 82 },
    { name: 'Age Gap Romance', description: 'A significant age difference creates unique dynamics and societal challenges.', popularity: 84 },
    { name: 'Small Town Romance', description: 'Love blossoms in a charming small town where everyone knows everyone.', popularity: 92 },
    { name: 'Royal Romance', description: 'A commoner falls for royalty, navigating palace intrigue and public scrutiny.', popularity: 88 },
    { name: 'Bodyguard Romance', description: 'A protector falls for the person they are sworn to guard.', popularity: 87 },
    { name: 'Reunion Romance', description: 'High school sweethearts or childhood friends reunite as adults and rekindle their connection.', popularity: 86 },
    { name: 'Mistaken Identity', description: 'A case of confused identity leads to unexpected romantic entanglements.', popularity: 80 },
    { name: 'Only One Bed', description: 'Characters forced to share a single bed, leading to awkward proximity and undeniable attraction.', popularity: 93 },
    { name: 'Touch Her and Die', description: 'An intensely protective love interest will go to any lengths to keep their partner safe.', popularity: 90 },
    { name: 'He Falls First', description: 'The male lead falls in love first, often secretly pining while the heroine is oblivious.', popularity: 91 },
    { name: 'Right Person, Wrong Time', description: 'Two people who are perfect for each other meet when circumstances prevent them from being together.', popularity: 88 },
    { name: 'Matchmaker Falls in Love', description: 'Someone playing cupid for others ends up finding their own unexpected romance.', popularity: 83 },
    { name: 'Love After Loss', description: 'A widowed or heartbroken character learns to love again after devastating loss.', popularity: 85 },
    { name: 'Bet or Dare Romance', description: 'A bet or dare sets a romance in motion, but real feelings develop unexpectedly.', popularity: 84 },
  ],
  default: [
    { name: 'The Chosen One', description: 'An ordinary person discovers they are destined to save the world or fulfill a great prophecy.', popularity: 95 },
    { name: 'Enemies to Allies', description: 'Former adversaries must work together against a greater threat, building trust and respect.', popularity: 93 },
    { name: 'Fish Out of Water', description: 'A character is thrust into an unfamiliar world or situation, forced to adapt and grow.', popularity: 90 },
    { name: 'The Mentor', description: 'A wise guide helps the protagonist develop their abilities and discover their true potential.', popularity: 88 },
    { name: 'Hidden Identity', description: 'A character conceals who they really are, leading to complications when the truth emerges.', popularity: 91 },
    { name: 'Revenge Quest', description: 'A character driven by the need to avenge a wrong, discovering the cost of vengeance along the way.', popularity: 89 },
    { name: 'Reluctant Hero', description: 'Someone who wants nothing to do with adventure is forced into heroism by circumstances.', popularity: 92 },
    { name: 'Unlikely Friendship', description: 'Two very different characters form a deep bond that defies expectations.', popularity: 87 },
    { name: 'Race Against Time', description: 'Characters must accomplish their goal before a deadly deadline.', popularity: 90 },
    { name: 'Betrayal and Redemption', description: 'A trusted ally betrays the protagonist, or a villain seeks redemption for past sins.', popularity: 91 },
    { name: 'Power Corrupts', description: 'A character gains great power and must resist its corrupting influence.', popularity: 88 },
    { name: 'Found Family', description: 'A group of misfits or strangers become a tight-knit family through shared trials.', popularity: 94 },
    { name: 'Dark Secret', description: 'A character harbors a devastating secret that threatens to destroy everything they care about.', popularity: 89 },
    { name: 'Underdog Triumph', description: 'A seemingly outmatched character overcomes overwhelming odds to achieve victory.', popularity: 93 },
    { name: 'Moral Dilemma', description: 'The protagonist faces an impossible choice where every option has devastating consequences.', popularity: 87 },
    { name: 'Lost Civilization', description: 'The discovery of a hidden or ancient civilization with secrets that could change the world.', popularity: 85 },
    { name: 'The Heist', description: 'A team assembles to pull off an elaborate theft or mission requiring cunning and teamwork.', popularity: 91 },
    { name: 'Survival', description: 'Characters must survive in hostile conditions — wilderness, post-apocalypse, or captivity.', popularity: 90 },
    { name: 'Prophecy and Destiny', description: 'Characters grapple with a foretold future, choosing whether to embrace or fight against fate.', popularity: 86 },
    { name: 'The Transformation', description: 'A character undergoes a fundamental change — physical, magical, or psychological — that reshapes their identity.', popularity: 88 },
    { name: 'Rebellion Against Tyranny', description: 'An oppressed group rises up against a powerful, unjust authority.', popularity: 92 },
    { name: 'Unreliable Narrator', description: 'The story is told by someone whose perspective may be distorted, biased, or outright deceptive.', popularity: 89 },
    { name: 'Last Stand', description: 'Characters make a final, desperate stand against impossible odds.', popularity: 91 },
    { name: 'Star-Crossed Fates', description: 'Characters bound together by destiny but pulled apart by circumstance or duty.', popularity: 87 },
    { name: 'The Anti-Hero', description: 'A protagonist who lacks conventional heroic qualities, operating in moral gray areas.', popularity: 93 },
    { name: 'Mind Games', description: 'Characters engage in psychological warfare, manipulation, and strategic deception.', popularity: 88 },
    { name: 'Coming of Age', description: 'A young character navigates the transition to adulthood through pivotal experiences.', popularity: 90 },
    { name: 'Identity Crisis', description: 'A character questions who they fundamentally are, often through memory loss or dual identities.', popularity: 85 },
    { name: 'The Sacrifice', description: 'A character must give up something precious — their life, love, or power — for the greater good.', popularity: 92 },
    { name: 'Secret Society', description: 'A hidden organization with its own rules and hierarchy pulls the protagonist into its world.', popularity: 86 },
  ],
};

// Genre family mapping for fallback lookup
function getGenreFamily(genre: string): string {
  const lower = genre.toLowerCase();
  if (lower.includes('romance') || lower.includes('love')) return 'romance';
  return 'default';
}

export async function POST(request: NextRequest) {
  try {
    const { genre } = await request.json();

    if (!genre) {
      return NextResponse.json({ error: 'Genre is required' }, { status: 400 });
    }

    try {
      // Use RouteLLM for intelligent trope generation
      const response = await Promise.race([
        routeLLMClient.generateWithSystem(
          `You are a bestselling book industry analyst and literary expert specializing in genre tropes and storytelling patterns. You have deep knowledge of what makes readers love books in every genre.`,
          `Generate exactly 30 popular and commercially successful tropes for the "${genre}" book genre.

For each trope, provide:
1. A clear, recognizable trope name (2-5 words)
2. A compelling 1-2 sentence description of how this trope works in ${genre} fiction
3. A popularity score from 75-99 based on how commercially successful and reader-beloved this trope is

Focus on tropes that:
- Are actively popular with today's readers
- Have driven bestselling books in the ${genre} genre
- Readers actively search for and request
- Can generate compelling, marketable story concepts
- Cover a range from classic staples to trending modern favorites

Return ONLY a JSON array of 30 objects, no other text:
[{"name": "Trope Name", "description": "What this trope is about and why readers love it", "popularity": 95}]

Sort by popularity score (highest first). Ensure variety — don't repeat similar concepts.`,
          'genre-analysis',
          {
            temperature: 0.7,
            maxTokens: 4000,
          }
        ),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 35000)),
      ]);

      // Parse the LLM response
      const content = response.content || '';
      const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const tropes = JSON.parse(jsonMatch[0]);
        // Validate and clean
        const validTropes = tropes
          .filter((t: any) => t.name && t.description)
          .slice(0, 30)
          .map((t: any, i: number) => ({
            id: `trope-${i + 1}`,
            name: t.name,
            description: t.description,
            popularity: Math.min(99, Math.max(75, t.popularity || 85)),
          }));

        if (validTropes.length >= 15) {
          return NextResponse.json({ success: true, tropes: validTropes });
        }
      }

      // LLM returned bad data — fall through to fallback
      throw new Error('Insufficient tropes from LLM');
    } catch (llmError) {
      console.warn('LLM trope generation failed, using fallback:', llmError);

      // Fallback: return curated tropes for this genre
      const family = getGenreFamily(genre);
      const fallbackTropes = (FALLBACK_TROPES[family] || FALLBACK_TROPES.default).map((t, i) => ({
        id: `trope-${i + 1}`,
        ...t,
      }));

      return NextResponse.json({ success: true, tropes: fallbackTropes, fallback: true });
    }
  } catch (error) {
    console.error('Trope generation error:', error);
    return NextResponse.json({ error: 'Failed to generate tropes' }, { status: 500 });
  }
}

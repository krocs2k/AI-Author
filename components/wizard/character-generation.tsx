'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Character, CharacterRecommendations, CharacterRole } from '@/lib/types';
import { Users, UserPlus, Sparkles, BookOpen, RefreshCw, ChevronDown, ChevronUp, Info, Target, UserCircle, Heart, Sword, HelpCircle } from 'lucide-react';

interface CharacterGenerationProps {
  genre?: string;
  title?: string;
  synopsis?: string;
  recommendations?: CharacterRecommendations;
  characters?: Character[];
  onFetchRecommendations: () => void;
  onGenerateCharacters: (config: { protagonists: number; antagonists: number; supporting: number; minor: number }) => void;
  onAddCharacter: (role: CharacterRole) => void;
  onNext: () => void;
  isLoading?: { [key: string]: boolean };
}

const ROLE_ICONS: Record<CharacterRole, React.ReactNode> = {
  protagonist: <UserCircle className="w-4 h-4" />,
  antagonist: <Sword className="w-4 h-4" />,
  supporting: <Users className="w-4 h-4" />,
  minor: <HelpCircle className="w-4 h-4" />,
  mentor: <BookOpen className="w-4 h-4" />,
  love_interest: <Heart className="w-4 h-4" />,
  sidekick: <UserPlus className="w-4 h-4" />,
  foil: <RefreshCw className="w-4 h-4" />,
};

const ROLE_COLORS: Record<CharacterRole, string> = {
  protagonist: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  antagonist: 'bg-red-500/20 border-red-500/50 text-red-300',
  supporting: 'bg-green-500/20 border-green-500/50 text-green-300',
  minor: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
  mentor: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
  love_interest: 'bg-pink-500/20 border-pink-500/50 text-pink-300',
  sidekick: 'bg-teal-500/20 border-teal-500/50 text-teal-300',
  foil: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
};

const ROLE_LABELS: Record<CharacterRole, string> = {
  protagonist: 'Protagonist',
  antagonist: 'Antagonist',
  supporting: 'Supporting',
  minor: 'Minor',
  mentor: 'Mentor',
  love_interest: 'Love Interest',
  sidekick: 'Sidekick',
  foil: 'Foil',
};

export function CharacterGeneration({
  genre,
  title,
  synopsis,
  recommendations,
  characters,
  onFetchRecommendations,
  onGenerateCharacters,
  onAddCharacter,
  onNext,
  isLoading
}: CharacterGenerationProps) {
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);
  const [config, setConfig] = useState({
    protagonists: recommendations?.breakdown.protagonists || 1,
    antagonists: recommendations?.breakdown.antagonists || 1,
    supporting: recommendations?.breakdown.supporting || 3,
    minor: recommendations?.breakdown.minor || 2
  });
  const [showTips, setShowTips] = useState(true);

  // Update config when recommendations change
  useState(() => {
    if (recommendations?.breakdown) {
      setConfig({
        protagonists: recommendations.breakdown.protagonists,
        antagonists: recommendations.breakdown.antagonists,
        supporting: recommendations.breakdown.supporting,
        minor: recommendations.breakdown.minor
      });
    }
  });

  const totalConfigured = config.protagonists + config.antagonists + config.supporting + config.minor;
  const hasCharacters = characters && characters.length > 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-100 mb-4">
          Character Development
        </h2>
        <p className="text-lg text-gray-400 mb-2">
          Create compelling characters based on {genre} bestseller analysis
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300">
            Recommended: {recommendations?.totalRecommended || 8} characters for optimal {genre} storytelling
          </span>
        </div>
      </div>

      {/* Recommendations Panel */}
      {recommendations && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-400" />
              Genre Analysis: {recommendations.genre}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Reasoning and Tips */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Why This Count?</h4>
                <p className="text-sm text-gray-400 mb-4">{recommendations.reasoning}</p>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTips(!showTips)}
                  className="mb-2"
                >
                  {showTips ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                  Genre Tips
                </Button>
                
                {showTips && (
                  <ul className="space-y-1">
                    {recommendations.genreSpecificTips.map((tip, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                        <Sparkles className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Right: Reference Books */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Bestseller Reference</h4>
                <div className="space-y-2">
                  {recommendations.topBooksReference.map((book, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800/50 px-3 py-2 rounded">
                      <span className="text-sm text-gray-300">{book.title}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {book.characterCount} total
                        </Badge>
                        <Badge variant="outline" className="text-xs text-teal-400 border-teal-500/50">
                          {book.mainCharacters} main
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Character Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Configure Characters
            </span>
            <Badge variant="outline" className="text-lg px-3 py-1 text-teal-400 border-teal-400/40">
              {totalConfigured} Total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Protagonists */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCircle className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Protagonists</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig(c => ({ ...c, protagonists: Math.max(1, c.protagonists - 1) }))}
                  disabled={config.protagonists <= 1}
                >
                  -
                </Button>
                <span className="text-2xl font-bold text-gray-100 w-8 text-center">{config.protagonists}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig(c => ({ ...c, protagonists: Math.min(3, c.protagonists + 1) }))}
                  disabled={config.protagonists >= 3}
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Antagonists */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sword className="w-5 h-5 text-red-400" />
                <span className="text-sm font-medium text-red-300">Antagonists</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig(c => ({ ...c, antagonists: Math.max(0, c.antagonists - 1) }))}
                  disabled={config.antagonists <= 0}
                >
                  -
                </Button>
                <span className="text-2xl font-bold text-gray-100 w-8 text-center">{config.antagonists}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig(c => ({ ...c, antagonists: Math.min(3, c.antagonists + 1) }))}
                  disabled={config.antagonists >= 3}
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Supporting */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-green-300">Supporting</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig(c => ({ ...c, supporting: Math.max(0, c.supporting - 1) }))}
                  disabled={config.supporting <= 0}
                >
                  -
                </Button>
                <span className="text-2xl font-bold text-gray-100 w-8 text-center">{config.supporting}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig(c => ({ ...c, supporting: Math.min(8, c.supporting + 1) }))}
                  disabled={config.supporting >= 8}
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Minor */}
            <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Minor</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig(c => ({ ...c, minor: Math.max(0, c.minor - 1) }))}
                  disabled={config.minor <= 0}
                >
                  -
                </Button>
                <span className="text-2xl font-bold text-gray-100 w-8 text-center">{config.minor}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfig(c => ({ ...c, minor: Math.min(5, c.minor + 1) }))}
                  disabled={config.minor >= 5}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={() => onGenerateCharacters(config)}
              disabled={isLoading?.characters}
              className="px-8"
            >
              {isLoading?.characters ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating {totalConfigured} Characters...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate {totalConfigured} Characters
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Characters */}
      {hasCharacters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Characters ({characters.length})
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddCharacter('supporting')}
                  disabled={isLoading?.addCharacter}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add Character
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {characters.map((character) => {
                const isExpanded = expandedCharacter === character.id;
                return (
                  <Card 
                    key={character.id} 
                    className={`border ${ROLE_COLORS[character.role].replace('text-', 'border-').split(' ')[1]}`}
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-100">{character.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={ROLE_COLORS[character.role]}>
                              {ROLE_ICONS[character.role]}
                              <span className="ml-1">{ROLE_LABELS[character.role]}</span>
                            </Badge>
                            {character.age && (
                              <Badge variant="outline" className="text-xs">{character.age}</Badge>
                            )}
                            {character.occupation && (
                              <Badge variant="outline" className="text-xs">{character.occupation}</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedCharacter(isExpanded ? null : character.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      {/* Brief Info */}
                      <p className="text-sm text-gray-400 mb-2">{character.physicalDescription}</p>
                      
                      {/* Key Traits */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {character.keyTraits.slice(0, isExpanded ? undefined : 3).map((trait, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                          {/* Personality */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 mb-1">Personality</h4>
                            <div className="flex flex-wrap gap-1">
                              {character.personality.map((trait, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-purple-500/10">
                                  {trait}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {/* Backstory */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 mb-1">Backstory</h4>
                            <p className="text-sm text-gray-300">{character.backstory}</p>
                          </div>
                          
                          {/* Motivation */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 mb-1">Motivation</h4>
                            <p className="text-sm text-gray-300">{character.motivation}</p>
                          </div>
                          
                          {/* Character Arc */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 mb-1">Character Arc</h4>
                            <p className="text-sm text-gray-300">{character.arc}</p>
                          </div>
                          
                          {/* Strengths & Flaws */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-semibold text-green-400 mb-1">Strengths</h4>
                              <ul className="text-xs text-gray-300 space-y-0.5">
                                {character.strengths.map((s, i) => (
                                  <li key={i}>• {s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-red-400 mb-1">Flaws</h4>
                              <ul className="text-xs text-gray-300 space-y-0.5">
                                {character.flaws.map((f, i) => (
                                  <li key={i}>• {f}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          {/* Voice Style */}
                          {character.voiceStyle && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-400 mb-1">Voice Style</h4>
                              <p className="text-sm text-gray-300 italic">"{character.voiceStyle}"</p>
                            </div>
                          )}
                          
                          {/* Relationships */}
                          {character.relationships.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-400 mb-1">Relationships</h4>
                              <div className="space-y-1">
                                {character.relationships.map((rel, i) => (
                                  <div key={i} className="text-xs text-gray-300">
                                    <span className="text-teal-400">{rel.characterName}</span>: {rel.relationship}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-col items-end gap-3">
        {!hasCharacters && !isLoading?.characters && (
          <p className="text-sm text-gray-400">
            Generate characters above or skip to continue
          </p>
        )}
        {isLoading?.characters && (
          <p className="text-sm text-amber-400">
            Generating characters one at a time... This may take a couple of minutes
          </p>
        )}
        <div className="flex gap-3">
          {!hasCharacters && (
            <Button
              variant="outline"
              onClick={onNext}
              disabled={isLoading?.characters}
              className="px-6 border-gray-600 text-gray-400 hover:text-gray-200"
            >
              Skip Characters
            </Button>
          )}
          <Button
            onClick={onNext}
            disabled={!hasCharacters || isLoading?.characters}
            className="px-8"
          >
            Continue to Content Creation
          </Button>
        </div>
      </div>
    </div>
  );
}

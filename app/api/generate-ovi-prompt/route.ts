import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { script, gender = 'female', persona = 'financial advisor' } = body;

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 });
    }

    // Generate OVI-formatted prompt with speech tags and audio caption
    const oviPrompt = generateOVIPrompt(script, gender, persona);

    return NextResponse.json({ prompt: oviPrompt });

  } catch (error: any) {
    console.error('OVI prompt generation failed:', error);
    return NextResponse.json({
      error: error.message || 'Failed to generate OVI prompt'
    }, { status: 500 });
  }
}

function generateOVIPrompt(script: string, gender: string, persona: string): string {
  // Determine voice characteristics based on gender and persona
  const voiceCharacteristics = getVoiceCharacteristics(gender, persona);

  // Format the prompt with OVI tags
  const visualDescription = getVisualDescription(gender, persona);

  return `${visualDescription} looks at camera and says, <S>${script}<E>.<AUDCAP>${voiceCharacteristics}<ENDAUDCAP>`;
}

function getVisualDescription(gender: string, persona: string): string {
  const genderDesc = gender === 'male' ? 'man' : 'woman';

  switch (persona) {
    case 'financial advisor':
      return `A professional ${genderDesc} in business attire`;
    case 'tech expert':
      return `A knowledgeable ${genderDesc} in casual professional wear`;
    case 'health coach':
      return `A friendly ${genderDesc} in comfortable athletic wear`;
    default:
      return `A confident ${genderDesc}`;
  }
}

function getVoiceCharacteristics(gender: string, persona: string): string {
  const baseVoice = gender === 'male'
    ? 'Professional male voice, confident tone'
    : 'Professional female voice, warm tone';

  const characteristics = [
    baseVoice,
    'clear enunciation',
    'measured pace',
    'studio quality acoustics',
  ];

  // Add persona-specific characteristics
  switch (persona) {
    case 'financial advisor':
      characteristics.push('authoritative delivery', 'trustworthy demeanor');
      break;
    case 'tech expert':
      characteristics.push('enthusiastic delivery', 'engaging tone');
      break;
    case 'health coach':
      characteristics.push('encouraging tone', 'motivational energy');
      break;
  }

  return characteristics.join(', ');
}

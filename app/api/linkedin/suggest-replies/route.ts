import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { comment, author, post } = await req.json();

    if (!comment || !author || !post) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      // Fallback if no key is provided, the client will use its hardcoded defaults or we can return some here
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const prompt = `You are an expert social media manager managing a LinkedIn account. 
You wrote the following post:
"${post}"

A user named ${author} commented:
"${comment}"

Write 3 short, engaging, and distinct reply suggestions. 
Return the output EXACTLY as a JSON array of objects, with no markdown formatting or extra text.
Each object must have two string properties: "tone" (e.g. "Warm", "Professional", "Curious") and "text" (the reply itself).
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // or any other fast groq model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" } // Using json mode if supported, otherwise rely on prompt
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq API error:', err);
      return NextResponse.json({ error: 'Failed to fetch from Groq' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let parsedReplies;
    try {
      // Sometimes models wrap in { "replies": [...] } when asked for json_object
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        parsedReplies = parsed;
      } else if (parsed.replies && Array.isArray(parsed.replies)) {
        parsedReplies = parsed.replies;
      } else {
        // Fallback parsing
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          parsedReplies = JSON.parse(match[0]);
        } else {
          throw new Error('Could not extract array');
        }
      }
    } catch (e) {
      console.error('Failed to parse Groq response:', content);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ replies: parsedReplies });
  } catch (error) {
    console.error('Error suggesting replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, conversationId, userId, forwardToAdmin } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle forwarding to admin
    if (forwardToAdmin) {
      // Mark conversation as requiring admin attention
      await supabase
        .from('support_conversations')
        .update({ requires_admin: true })
        .eq('id', conversationId);
      
      return new Response(
        JSON.stringify({ 
          response: "I've forwarded your request to our support team. A superadmin will respond to you shortly. Thank you for your patience!",
          forwardedToAdmin: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation history for context
    const { data: messages } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    const conversationHistory = messages?.map(m => ({
      role: m.sender_type === 'user' ? 'user' : 'assistant',
      content: m.message
    })) || [];

    // Check if this needs admin help based on keywords
    const needsAdminKeywords = [
      'speak to admin', 'talk to human', 'real person', 'human support',
      'superadmin', 'talk to someone', 'speak to someone', 'contact support',
      'need help from admin', 'escalate', 'manager', 'supervisor'
    ];
    
    const lowerMessage = message.toLowerCase();
    const needsAdmin = needsAdminKeywords.some(k => lowerMessage.includes(k));

    if (needsAdmin) {
      await supabase
        .from('support_conversations')
        .update({ requires_admin: true })
        .eq('id', conversationId);
      
      return new Response(
        JSON.stringify({ 
          response: "I understand you'd like to speak with our support team directly. I've notified a superadmin who will respond to you as soon as possible. In the meantime, is there anything else I can help you with?",
          forwardedToAdmin: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a helpful support assistant for ConnectHub, a platform that connects companies with clients.

About ConnectHub:
- Companies can register and post jobs and products
- Users (clients) can browse and express interest in products/jobs
- Company registration requires a UGX 50,000 subscription fee
- Companies have virtual wallets where they can deposit money via mobile money to +256740327473
- The superadmin approves company registrations and manages the platform

You should:
- Answer questions about how the platform works
- Help with common issues like registration, browsing, deposits
- Be friendly and professional
- If you cannot help or the user specifically asks to speak with a human/admin, suggest forwarding to the superadmin
- Keep responses concise but helpful

If the user asks to talk to an admin or needs specialized help you cannot provide, tell them to type "talk to admin" to be connected with support.`
          },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Service is busy, please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const botResponse = aiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again or type 'talk to admin' to speak with support.";

    return new Response(
      JSON.stringify({ response: botResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Support chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simple test to verify both user and AI messages are saved by the proxy endpoint
// This would be run in a browser console after sending a message

// 1. Send a message in the chat interface
// 2. Wait for the AI response to complete
// 3. Run this script in the browser console

async function testMessageSaving() {
  console.log('Testing message saving (both user and AI)...');
  
  // Get the current conversation ID from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  const conversationId = pathParts[pathParts.indexOf('conversations') + 1];
  
  if (!conversationId) {
    console.error('Could not find conversation ID in URL');
    return;
  }
  
  console.log(`Checking messages for conversation ${conversationId}...`);
  
  // Fetch the messages for this conversation
  try {
    const response = await fetch(`/api/messages?conversationId=${conversationId}`);
    const data = await response.json();
    
    if (data.messages) {
      console.log(`Found ${data.messages.length} messages`);
      
      // Check if we have at least one user message and one AI message
      const userMessages = data.messages.filter(msg => msg.sender === 'user');
      const aiMessages = data.messages.filter(msg => msg.sender === 'ai');
      
      if (userMessages.length === 0) {
        console.log('❌ No user messages found');
        return;
      }
      
      if (aiMessages.length === 0) {
        console.log('❌ No AI messages found');
        return;
      }
      
      // Check the last user message
      const lastUserMessage = userMessages[userMessages.length - 1];
      console.log('Last user message:', lastUserMessage);
      
      if (lastUserMessage.id && lastUserMessage.id !== 0) {
        console.log('✅ User message was saved to database with proper ID');
      } else {
        console.log('❌ User message has invalid ID');
      }
      
      // Check the last AI message
      const lastAIMessage = aiMessages[aiMessages.length - 1];
      console.log('Last AI message:', lastAIMessage);
      
      // Check if it has the expected metadata
      if (lastAIMessage.ai_provider && lastAIMessage.model_used) {
        console.log('✅ AI message was saved with metadata by proxy endpoint');
      } else {
        console.log('❌ AI message missing metadata');
      }
      
      // Check if it has citations if applicable
      if (lastAIMessage.citations && lastAIMessage.citations.length > 0) {
        console.log(`✅ AI message has ${lastAIMessage.citations.length} citations`);
      }
      
      // Verify the message order (user message should come before AI message)
      const lastMessageIndex = data.messages.length - 1;
      const secondLastMessageIndex = data.messages.length - 2;
      
      if (data.messages[lastMessageIndex].sender === 'ai' &&
          data.messages[secondLastMessageIndex].sender === 'user') {
        console.log('✅ Messages are in correct order (user then AI)');
      } else {
        console.log('❌ Messages are not in expected order');
      }
    } else {
      console.error('Failed to fetch messages:', data.error);
    }
  } catch (error) {
    console.error('Error testing AI message saving:', error);
  }
}

// Run the test
testMessageSaving();
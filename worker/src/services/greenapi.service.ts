import axios from 'axios';

const GREEN_API_ID = process.env.GREEN_API_ID;
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN;
const GREEN_API_URL = `https://api.green-api.com/waInstance${GREEN_API_ID}`;

export async function sendWhatsAppMessage(chatId: string, message: string): Promise<void> {
  if (!GREEN_API_ID || !GREEN_API_TOKEN) {
    throw new Error('GreenAPI credentials not configured');
  }

  try {
    // Format chatId (remove + if present, ensure it's a number)
    const formattedChatId = chatId.replace(/[^0-9]/g, '');

    const response = await axios.post(
      `${GREEN_API_URL}/sendMessage/${GREEN_API_TOKEN}`,
      {
        chatId: `${formattedChatId}@c.us`, // For personal chats
        // For group chats, use: `${formattedChatId}@g.us`
        message: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data.idMessage) {
      console.log(`✅ Message sent to ${chatId}, messageId: ${response.data.idMessage}`);
    } else {
      throw new Error('Failed to send message: ' + JSON.stringify(response.data));
    }
  } catch (error: any) {
    console.error('GreenAPI error:', error.response?.data || error.message);
    throw new Error(`Failed to send WhatsApp message: ${error.message}`);
  }
}

// For group messages
export async function sendWhatsAppGroupMessage(groupId: string, message: string): Promise<void> {
  if (!GREEN_API_ID || !GREEN_API_TOKEN) {
    throw new Error('GreenAPI credentials not configured');
  }

  try {
    const formattedGroupId = groupId.replace(/[^0-9]/g, '');

    const response = await axios.post(
      `${GREEN_API_URL}/sendMessage/${GREEN_API_TOKEN}`,
      {
        chatId: `${formattedGroupId}@g.us`, // Group chat format
        message: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data.idMessage) {
      console.log(`✅ Group message sent to ${groupId}, messageId: ${response.data.idMessage}`);
    } else {
      throw new Error('Failed to send group message: ' + JSON.stringify(response.data));
    }
  } catch (error: any) {
    console.error('GreenAPI group error:', error.response?.data || error.message);
    throw new Error(`Failed to send WhatsApp group message: ${error.message}`);
  }
}




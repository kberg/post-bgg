// Handles BGG authentication and geeklist item posting.
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const LOGIN_URL = 'https://boardgamegeek.com/login/api/v1';
const POST_ITEM_BASE_URL = 'https://api.geekdo.com/api/geeklist';

export class BggClient {
  private client: ReturnType<typeof wrapper>;
  private jar: CookieJar;
  private authToken: string | null = null;

  constructor() {
    this.jar = new CookieJar();
    this.client = wrapper(axios.create({ jar: this.jar, withCredentials: true }));
  }

  async login(username: string, password: string): Promise<void> {
    const response = await this.client.post(
      LOGIN_URL,
      { credentials: { username, password } },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.status !== 204 && response.status !== 200) {
      throw new Error(`Login failed with status ${response.status}`);
    }

    // BGG's write API uses a GeekAuth bearer token. The value is the SessionID
    // cookie set during login (undocumented but confirmed via DevTools inspection).
    const cookies = await this.jar.getCookies('https://boardgamegeek.com');
    const sessionCookie = cookies.find(c => c.key === 'SessionID');
    if (!sessionCookie) {
      throw new Error(`Login succeeded but no SessionID cookie found`);
    }
    this.authToken = sessionCookie.value;
  }

  async postGeeklistItem(params: {
    geeklistId: number;
    objectId: number;
    body: string;
  }): Promise<void> {
    if (!this.authToken) {
      throw new Error('Not logged in');
    }

    const url = `${POST_ITEM_BASE_URL}/${params.geeklistId}/listitem`;
    const response = await this.client.post(
      url,
      {
        item: { type: 'thing', id: String(params.objectId) },
        imageid: null,
        imageOverridden: false,
        index: 1,
        body: params.body,
        rollsEnabled: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `GeekAuth ${this.authToken}`,
        },
      }
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Post failed with status ${response.status}: ${JSON.stringify(response.data)}`);
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

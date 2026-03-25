export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
  duration: number; // in seconds
  likes: number;
  comments: number;
  category: string;
}

export const BOLLYWOOD_SONGS: Song[] = [
  {
    id: '3',
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    url: 'https://djjohal.it.com/songs/128/Punjabi/361/Tum%20Hi%20Ho%20-%20Djjohal.fm.mp3',
    cover: 'https://i.scdn.co/image/ab67616d00001e026404721c1943d5069f0805f3',
    duration: 262,
    likes: 1240,
    comments: 85,
    category: 'Hindi Hits'
  },
  {
    id: '2',
    title: 'Kesariya',
    artist: 'Arijit Singh',
    url: 'https://pagalnew.com/128-downloads/30350',
    cover: 'https://akm-img-a-in.tosshub.com/indiatoday/images/story/202207/Kesariya-Brahmastra-Ranbir-Kap_1200x768.jpeg?VersionId=7XIxpyAi34HEBZv2KZlNcFe7cgbelr3e&size=690:388',
    duration: 268,
    likes: 3500,
    comments: 210,
    category: 'Hindi Hits'
  },
  {
    id: '1',
    title: 'Paradox',
    artist: 'Dhanda Nyoliwala',
    url: 'https://cdnsongs.com/music/data/Haryanvi/202602/Paradox/128/Paradox_1.mp3',
    cover: 'https://djjohal.it.com/content/media/covers/1753273868.jpg',
    duration: 300,
    likes: 890,
    comments: 45,
    category: 'Hindi Hits'
  },
  {
    id: '4',
    title: 'Kal Ho Naa Ho',
    artist: 'Sonu Nigam',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    cover: 'https://picsum.photos/seed/bollywood4/400/400',
    duration: 322,
    likes: 2100,
    comments: 130,
    category: 'Sad'
  },
  {
    id: '5',
    title: 'Gerua',
    artist: 'Arijit Singh, Antara Mitra',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    cover: 'https://picsum.photos/seed/bollywood5/400/400',
    duration: 345,
    likes: 1560,
    comments: 92,
    category: 'Romance'
  },
  {
    id: '6',
    title: 'Zaalima',
    artist: 'Arijit Singh, Harshdeep Kaur',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    cover: 'https://picsum.photos/seed/bollywood6/400/400',
    duration: 298,
    likes: 1840,
    comments: 115,
    category: 'Romance'
  },
  {
    id: '7',
    title: 'Ghungroo',
    artist: 'Arijit Singh, Shilpa Rao',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    cover: 'https://picsum.photos/seed/bollywood7/400/400',
    duration: 302,
    likes: 2450,
    comments: 156,
    category: 'Party'
  },
  {
    id: '8',
    title: 'Dil Diyan Gallan',
    artist: 'Atif Aslam',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    cover: 'https://picsum.photos/seed/bollywood8/400/400',
    duration: 288,
    likes: 4100,
    comments: 320,
    category: 'Romance'
  },
  {
    id: '9',
    title: 'Nashe Si Chadh Gayi',
    artist: 'Arijit Singh',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    cover: 'https://picsum.photos/seed/bollywood9/400/400',
    duration: 238,
    likes: 3200,
    comments: 198,
    category: 'Party'
  },
  {
    id: '10',
    title: 'Pee Loon',
    artist: 'Mohit Chauhan',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    cover: 'https://picsum.photos/seed/bollywood10/400/400',
    duration: 285,
    likes: 1750,
    comments: 112,
    category: 'Romance'
  },
  {
    id: '11',
    title: 'Agar Tum Saath Ho',
    artist: 'Alka Yagnik, Arijit Singh',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3',
    cover: 'https://picsum.photos/seed/bollywood11/400/400',
    duration: 341,
    likes: 5600,
    comments: 450,
    category: 'Sad'
  },
  {
    id: '12',
    title: 'Kabira',
    artist: 'Tochi Raina, Rekha Bhardwaj',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3',
    cover: 'https://picsum.photos/seed/bollywood12/400/400',
    duration: 223,
    likes: 2900,
    comments: 234,
    category: 'Feel Good'
  },
  {
    id: '13',
    title: 'Ilahi',
    artist: 'Arijit Singh',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3',
    cover: 'https://picsum.photos/seed/bollywood13/400/400',
    duration: 213,
    likes: 4500,
    comments: 180,
    category: 'Road Trip'
  },
  {
    id: '14',
    title: 'Matargashti',
    artist: 'Mohit Chauhan',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3',
    cover: 'https://picsum.photos/seed/bollywood14/400/400',
    duration: 328,
    likes: 2300,
    comments: 140,
    category: 'Road Trip'
  },
  {
    id: '15',
    title: 'Kun Faya Kun',
    artist: 'A.R. Rahman, Javed Ali',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover: 'https://picsum.photos/seed/bollywood15/400/400',
    duration: 473,
    likes: 8900,
    comments: 1200,
    category: 'Relax'
  },
  {
    id: '16',
    title: 'Zinda',
    artist: 'Siddharth Mahadevan',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://picsum.photos/seed/bollywood16/400/400',
    duration: 211,
    likes: 3400,
    comments: 250,
    category: 'Energise'
  },
  {
    id: '17',
    title: 'Kar Har Maidaan Fateh',
    artist: 'Sukhwinder Singh, Shreya Ghoshal',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://picsum.photos/seed/bollywood17/400/400',
    duration: 311,
    likes: 5600,
    comments: 410,
    category: 'Work Out'
  },
  {
    id: '18',
    title: 'Raataan Lambiyan',
    artist: 'Jubin Nautiyal, Asees Kaur',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    cover: 'https://picsum.photos/seed/bollywood18/400/400',
    duration: 230,
    likes: 12000,
    comments: 1500,
    category: 'Romance'
  },
  {
    id: '19',
    title: 'The Story of Bollywood',
    artist: 'Bollywood Insider',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    cover: 'https://picsum.photos/seed/podcast1/400/400',
    duration: 1200,
    likes: 500,
    comments: 30,
    category: 'Podcasts'
  },
  {
    id: '20',
    title: 'Deep Focus Beats',
    artist: 'Lofi Bollywood',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    cover: 'https://picsum.photos/seed/focus1/400/400',
    duration: 1800,
    likes: 2100,
    comments: 85,
    category: 'Focus'
  },
  {
    id: '21',
    title: 'Lullaby for Sleep',
    artist: 'Calm Bollywood',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    cover: 'https://picsum.photos/seed/sleep1/400/400',
    duration: 3600,
    likes: 1500,
    comments: 40,
    category: 'Sleep'
  },
  {
    id: '22',
    title: 'Brown Munde',
    artist: 'AP Dhillon, Gurinder Gill',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover: 'https://picsum.photos/seed/punjabi1/400/400',
    duration: 240,
    likes: 15000,
    comments: 2000,
    category: 'Punjabi'
  },
  {
    id: '23',
    title: 'Excuses',
    artist: 'AP Dhillon, Intense',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://picsum.photos/seed/punjabi2/400/400',
    duration: 180,
    likes: 12000,
    comments: 1500,
    category: 'Punjabi'
  },
  {
    id: '24',
    title: 'Lover',
    artist: 'Diljit Dosanjh',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://picsum.photos/seed/punjabi3/400/400',
    duration: 210,
    likes: 9000,
    comments: 800,
    category: 'Punjabi'
  },
  {
    id: '25',
    title: 'Community Remix 1',
    artist: 'DJ Remix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    cover: 'https://picsum.photos/seed/comm1/400/400',
    duration: 300,
    likes: 450,
    comments: 120,
    category: 'From the community'
  },
  {
    id: '26',
    title: 'Community Remix 2',
    artist: 'User Beats',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    cover: 'https://picsum.photos/seed/comm2/400/400',
    duration: 280,
    likes: 320,
    comments: 85,
    category: 'From the community'
  },
  {
    id: '27',
    title: 'Quick Pick 1',
    artist: 'Various Artists',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    cover: 'https://picsum.photos/seed/quick1/400/400',
    duration: 150,
    likes: 1200,
    comments: 50,
    category: 'Quick Picks'
  },
  {
    id: '28',
    title: 'Quick Pick 2',
    artist: 'Various Artists',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    cover: 'https://picsum.photos/seed/quick2/400/400',
    duration: 160,
    likes: 1100,
    comments: 45,
    category: 'Quick Picks'
  },
  {
    id: '29',
    title: 'Chaleya',
    artist: 'Arijit Singh, Shilpa Rao',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover: 'https://picsum.photos/seed/hindi1/400/400',
    duration: 200,
    likes: 8500,
    comments: 450,
    category: 'Hindi Hits'
  },
  {
    id: '30',
    title: 'Heeriye',
    artist: 'Arijit Singh, Jasleen Royal',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://picsum.photos/seed/hindi2/400/400',
    duration: 195,
    likes: 7200,
    comments: 380,
    category: 'Hindi Hits'
  },
  {
    id: '31',
    title: 'Apna Bana Le',
    artist: 'Arijit Singh',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://picsum.photos/seed/hindi3/400/400',
    duration: 264,
    likes: 9100,
    comments: 520,
    category: 'Hindi Hits'
  },
  {
    id: '32',
    title: 'Maan Meri Jaan',
    artist: 'King',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    cover: 'https://picsum.photos/seed/hindi4/400/400',
    duration: 194,
    likes: 15000,
    comments: 1200,
    category: 'Hindi Hits'
  },
  {
    id: '33',
    title: 'Besharam Rang',
    artist: 'Shilpa Rao, Caralisa Monteiro',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    cover: 'https://picsum.photos/seed/hindi5/400/400',
    duration: 258,
    likes: 6400,
    comments: 890,
    category: 'Hindi Hits'
  },
  {
    id: '34',
    title: 'Jhoome Jo Pathaan',
    artist: 'Arijit Singh, Sukriti Kakar',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    cover: 'https://picsum.photos/seed/hindi6/400/400',
    duration: 202,
    likes: 7800,
    comments: 950,
    category: 'Hindi Hits'
  },
  {
    id: '35',
    title: 'Quick Pick 3',
    artist: 'Various Artists',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover: 'https://picsum.photos/seed/quick3/400/400',
    duration: 180,
    likes: 950,
    comments: 30,
    category: 'Quick Picks'
  },
  {
    id: '36',
    title: 'Quick Pick 4',
    artist: 'Various Artists',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://picsum.photos/seed/quick4/400/400',
    duration: 175,
    likes: 820,
    comments: 25,
    category: 'Quick Picks'
  },
  {
    id: '37',
    title: 'Quick Pick 5',
    artist: 'Various Artists',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://picsum.photos/seed/quick5/400/400',
    duration: 190,
    likes: 1100,
    comments: 40,
    category: 'Quick Picks'
  },
  {
    id: '38',
    title: 'Quick Pick 6',
    artist: 'Various Artists',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    cover: 'https://picsum.photos/seed/quick6/400/400',
    duration: 165,
    likes: 750,
    comments: 20,
    category: 'Quick Picks'
  },
  {
    id: '39',
    title: 'Quick Pick 7',
    artist: 'Various Artists',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    cover: 'https://picsum.photos/seed/quick7/400/400',
    duration: 155,
    likes: 880,
    comments: 35,
    category: 'Quick Picks'
  },
  {
    id: '40',
    title: 'Quick Pick 8',
    artist: 'Various Artists',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    cover: 'https://picsum.photos/seed/quick8/400/400',
    duration: 145,
    likes: 1050,
    comments: 42,
    category: 'Quick Picks'
  }
];

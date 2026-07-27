// Mock "Stories" content — short-lived slide sequences shown in a
// full-screen viewer when a story bubble is tapped, LinkedIn/Instagram
// style. Purely client-side demo data; not backed by the API.
//
// A slide is one of three kinds:
//  - 'image'  — a photo with an optional caption overlay (the default when
//               `image` is set and `type` is omitted).
//  - 'video'  — an autoplaying muted clip, optionally with a caption.
//  - 'text'   — no media at all: a big heading + body over a solid/gradient
//               background, for announcements ("We're hiring", "Closed our
//               Series B") that don't need a photo.

export type StorySlideType = 'image' | 'video' | 'text';

export interface StorySlide {
  type?: StorySlideType;
  image?: string;
  video?: string;
  caption?: string;
  heading?: string;
  text?: string;
  background?: string;
}

export interface Story {
  id: string;
  type: 'user' | 'company';
  name: string;
  avatarUrl: string;
  // Where the story bubble should link when the viewer is closed / the
  // avatar itself is clicked outside the "open viewer" flow.
  profileSlug: string;
  slides: StorySlide[];
}

export const mockStories: Story[] = [
  {
    id: 'story-sarah-chen',
    type: 'user',
    name: 'Sarah Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    profileSlug: 'sarah-chen',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=1400&fit=crop',
        caption: 'On-site with the factory floor team today — watching real workflows beats any wireframe review. 👷‍♀️',
      },
      {
        type: 'text',
        heading: 'Adoption: 23% → 91%',
        text: 'Redesigned the primary action to match the physical gesture workers already use on the machine. Two weeks later, this is where adoption landed.',
        background: 'linear-gradient(155deg, #9b4a46 0%, #4a2321 100%)',
      },
      {
        image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=1400&fit=crop',
        caption: 'New dashboard prototype getting its first live reactions. So far so good!',
      },
    ],
  },
  {
    id: 'story-yuki-tanaka',
    type: 'user',
    name: 'Yuki Tanaka',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    profileSlug: 'yuki-tanaka',
    slides: [
      {
        type: 'video',
        video: 'https://www.w3schools.com/html/mov_bbb.mp4',
        caption: 'Calibration run #12 for the new cobot arm — under 4 minutes setup, exactly on target. 🤖',
      },
      {
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=1400&fit=crop',
        caption: 'Patent #8 filed. Sometimes the elegant fix hides in the obvious place.',
      },
    ],
  },
  {
    id: 'story-priya-nair',
    type: 'user',
    name: 'Priya Nair',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    profileSlug: 'priya-nair',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=1400&fit=crop',
        caption: 'Late night in the lab — federated learning benchmarks finally converging across all 8 hospital sites.',
      },
      {
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=1400&fit=crop',
        caption: 'Coffee count: 4. Bugs fixed: 1. Worth it. ☕',
      },
    ],
  },
  {
    id: 'story-tom-bradley',
    type: 'user',
    name: 'Tom Bradley',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
    profileSlug: 'tom-bradley',
    slides: [
      {
        type: 'text',
        heading: 'Investment #41 ✅',
        text: 'ERP software for trade finance intermediaries. $9T market still running on manual processes. Perfect storm.',
        background: 'linear-gradient(155deg, #c6a15b 0%, #7a5a2f 100%)',
      },
      {
        image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=1400&fit=crop',
        caption: 'Partner meeting day. Three term sheets on the table, one clear favorite.',
      },
    ],
  },
  {
    id: 'story-ecostream',
    type: 'company',
    name: 'EcoStream Solutions',
    avatarUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop',
    profileSlug: 'ecostream-solutions',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?w=800&h=1400&fit=crop',
        caption: 'Closed-loop system now live at our largest chemical plant deployment yet — 62% less freshwater intake.',
      },
      {
        type: 'text',
        heading: '2.1B liters / year',
        text: 'Our Hamburg greywater network just crossed 2.1 billion liters of water recycled annually — enough to offset ~14,000 households.',
        background: 'linear-gradient(155deg, #2f5d4e 0%, #14312a 100%)',
      },
    ],
  },
  {
    id: 'story-novatech',
    type: 'company',
    name: 'NovaTech Robotics',
    avatarUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
    profileSlug: 'novatech-robotics',
    slides: [
      {
        type: 'video',
        video: 'https://www.w3schools.com/html/mov_bbb.mp4',
        caption: 'Next-gen cobot line demo booked out through next month already. 🤖',
      },
    ],
  },
  {
    id: 'story-solaris',
    type: 'company',
    name: 'Solaris Energy',
    avatarUrl: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=400&fit=crop',
    profileSlug: 'solaris-energy',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=1400&fit=crop',
        caption: '40th large-scale solar installation commissioned this year. 280 MW added. ☀️',
      },
      {
        type: 'text',
        heading: 'Cheapest kWh, ever.',
        text: 'Solar is now the cheapest form of electricity ever produced in human history. The economics have permanently shifted.',
        background: 'linear-gradient(155deg, #c6a15b 0%, #8a5a1f 100%)',
      },
    ],
  },
  {
    id: 'story-emberoak',
    type: 'company',
    name: 'Ember & Oak',
    avatarUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop',
    profileSlug: 'ember-and-oak',
    slides: [
      {
        image: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=800&h=1400&fit=crop',
        caption: 'Fall menu just dropped 🔥 wood-fired squash, ribeye with bone marrow butter, new Basque cheesecake.',
      },
      {
        image: 'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&h=1400&fit=crop',
        caption: 'Thrilled to be featured in Austin Monthly\'s Best New Restaurants — thank you to the whole team.',
      },
    ],
  },
  {
    id: 'story-deepcode',
    type: 'company',
    name: 'DeepCode AI',
    avatarUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=400&fit=crop',
    profileSlug: 'deepcode-ai',
    slides: [
      {
        type: 'text',
        heading: 'We closed our Series B 🎉',
        text: '$40M to expand our automated code security platform across Europe. Hiring ML engineers and security researchers now.',
        background: 'linear-gradient(155deg, #1c1a17 0%, #3a3a35 100%)',
      },
      {
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=1400&fit=crop',
        caption: 'Continuous scan across a Fortune 100 codebase — 1,200+ critical vulnerabilities caught before production.',
      },
    ],
  },
];

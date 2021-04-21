import { Image } from '../types';

export type TagID = 'space' | 'beachCity' | 'temple';

export type TaggedImages = Record<TagID, Image[]>

export const tagDisplays: Record<TagID, string> = {
	space: 'Space',
	beachCity: 'Beach City',
	temple: 'Temple'
}

export const tags: TagID[] = ['beachCity', 'space', 'temple'];
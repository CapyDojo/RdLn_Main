import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
export const parseXml = xml => new window.DOMParser().parseFromString(xml, 'application/xml');

export type PrivacyPolicy = {
  title: string;
  subtitle: string;
  companyName: string;
  updatedAt: string;
  updatedAtText: string;
  sourceNoticeDate: string;
  contact: { email: string; phone: string; address: string };
  introduction: string;
  sections: { id: string; title: string; paragraphs: string[]; items?: string[] }[];
};

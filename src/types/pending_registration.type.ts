export interface PendingPayload {
  email:        string;
  username:     string;
  name:         string;
  passwordHash: string;
  role:         "player" | "organization";
  contactNo:    string | null;
  height:       string | null;
  weight:       string | null;
  birthday:     string | null;
  categories:   string[];
  websiteUrl:   string | null;
  city:         string | null;
  state:        string | null;
  country:      string | null;
}
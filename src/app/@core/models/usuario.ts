export type UserSubscriber = {
  user:        User;
  userService: UserService;
}

export type User = {
  at_hash:             string;
  sub:                 string;
  aud:                 string[];
  role:                string[];
  azp:                 string;
  iss:                 string;
  documento:           string;
  documento_compuesto: string;
  exp:                 number;
  nonce:               string;
  iat:                 number;
  email:               string;
}

export type UserService = {
  role:                string[];
  documento:           string;
  documento_compuesto: string;
  email:               string;
  FamilyName:          string;
  Codigo:              string;
  Estado:              string;
}

export interface RegisterBody {
  email: string
  password: string
  name?: string
}

export interface LoginBody {
  email: string
  password: string
}

export interface JwtPayload {
  userId: string
  email: string
}

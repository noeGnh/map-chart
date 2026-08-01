export interface MapDataValue {
  value?: number
  color?: string
  legendLabel?: string
}

export interface MapData {
  [key: string]: number | MapDataValue
}

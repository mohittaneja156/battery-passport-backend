import mongoose from 'mongoose'

const passportSchema = new mongoose.Schema({
  generalInformation: {
    manufacturer: String,
    model: String,
    serialNumber: String,
    productionDate: Date
  },
  materialComposition: {
    cathode: String,
    anode: String,
    electrolyte: String,
    casing: String
  },
  carbonFootprint: {
    productionKgCO2e: Number,
    lifecycleKgCO2e: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

passportSchema.pre('save', function (next) { this.updatedAt = new Date(); next() })

export const Passport = mongoose.model('Passport', passportSchema)

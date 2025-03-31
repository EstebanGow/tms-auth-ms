import * as bcrypt from 'bcrypt'

export default class EncriptacionService {
    private readonly saltRounds = 10

    async encriptar(textoPlano: string): Promise<string> {
        return bcrypt.hash(textoPlano, this.saltRounds)
    }

    async verificar(textoPlano: string, textoEncriptado: string): Promise<boolean> {
        return bcrypt.compare(textoPlano, textoEncriptado)
    }
}

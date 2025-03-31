import { DEPENDENCY_CONTAINER } from '@common/dependencies/DependencyContainer'
import { AutenticacionRepository } from '@modules/Autenticacion/domain/repositories/AutenticacionRepository'
import TYPESDEPENDENCIES from '@modules/Autenticacion/dependencies/TypesDependencies'
import TokenService from '@infrastructure/services/TokenService'
import TYPESDEPENDENCIESGLOBAL from '@common/dependencies/TypesDependencies'
import UsuarioAutenticacionEntity from '@modules/Autenticacion/domain/entities/UsuarioAutenticacionEntity'
import CustomError from '@common/util/CustomError'
import EncriptacionService from '@infrastructure/services/EncriptacionService'
import { IAutenticacionIn } from '../dto/in'

export default class AutenticacionUseCase {
    private autenticacionRepository = DEPENDENCY_CONTAINER.get<AutenticacionRepository>(
        TYPESDEPENDENCIES.AutenticacionRepository,
    )

    private tokenService = DEPENDENCY_CONTAINER.get<TokenService>(TYPESDEPENDENCIESGLOBAL.TokenService)

    private encriptacionService = DEPENDENCY_CONTAINER.get<EncriptacionService>(
        TYPESDEPENDENCIESGLOBAL.EncriptacionService,
    )

    async execute(data: IAutenticacionIn): Promise<string | null> {
        const usuario = await this.validarCredenciales(data)
        const token = this.tokenService.generarToken(usuario)
        return token
    }

    private async validarCredenciales(data: IAutenticacionIn): Promise<UsuarioAutenticacionEntity> {
        const usuario = await this.autenticacionRepository.obtenerUsuario(data)

        if (!usuario) {
            throw new CustomError('Usuario o contraseña incorrectos', 401, true)
        }

        const credencialesValidas = await this.compararContrasenas(data.clave, usuario.clave)

        if (!credencialesValidas) {
            throw new CustomError('Usuario o contraseña incorrectos', 401, true)
        }

        return usuario
    }

    private async compararContrasenas(contrasenaProporcionada: string, contrasenaAlmacenada: string): Promise<boolean> {
        const credencialesValidas = await this.encriptacionService.verificar(
            contrasenaProporcionada,
            contrasenaAlmacenada,
        )
        return credencialesValidas
    }
}

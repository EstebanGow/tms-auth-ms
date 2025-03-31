import { IServer } from '@infrastructure/app/server'
import FastifyServer from '@infrastructure/app/server/fastify/Fastify'
import TYPESSERVER from '@infrastructure/app/server/TypeServer'
import { Container } from 'inversify'
import { IDatabase, IMain } from 'pg-promise'
import cm from '@infrastructure/bd/adapter/Config'
import { ITokenService } from '@common/interfaces/ITokenService'
import TokenService from '@infrastructure/services/TokenService'
import EncriptacionService from '@infrastructure/services/EncriptacionService'
import TYPESDEPENDENCIES from './TypesDependencies'

export const DEPENDENCY_CONTAINER = new Container()

export const globalDependencies = (): void => {
    DEPENDENCY_CONTAINER.bind<IServer>(TYPESSERVER.Fastify).to(FastifyServer).inSingletonScope()
    DEPENDENCY_CONTAINER.bind<IDatabase<IMain>>(TYPESDEPENDENCIES.dbTms).toConstantValue(cm)
    DEPENDENCY_CONTAINER.bind<ITokenService>(TYPESDEPENDENCIES.TokenService)
        .toDynamicValue(() => {
            return new TokenService()
        })
        .inSingletonScope()
    DEPENDENCY_CONTAINER.bind<EncriptacionService>(TYPESDEPENDENCIES.EncriptacionService)
        .toDynamicValue(() => {
            return new EncriptacionService()
        })
        .inSingletonScope()
}

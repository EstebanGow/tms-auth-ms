import 'module-alias/register'
import 'reflect-metadata'
import ModulesFactory from '@common/modules/ModulesFactory'
import TYPESSERVER from '@infrastructure/app/server/TypeServer'
import AutenticacionModule from '@modules/Autenticacion/AutenticacionModule'
import { globalDependencies } from '@common/dependencies/DependencyContainer'

async function bootstrap() {
    globalDependencies()
    const modulesFactory = new ModulesFactory()
    const server = modulesFactory.createServer(TYPESSERVER.Fastify)
    modulesFactory.initModules([AutenticacionModule])
    server?.start()
}
bootstrap()

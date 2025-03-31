import 'reflect-metadata'
import { DEPENDENCY_CONTAINER } from '@common/dependencies/DependencyContainer';
import { AutenticacionRepository } from '@modules/Autenticacion/domain/repositories/AutenticacionRepository';
import TYPESDEPENDENCIES from '@modules/Autenticacion/dependencies/TypesDependencies';
import TokenService from '@infrastructure/services/TokenService';
import TYPESDEPENDENCIESGLOBAL from '@common/dependencies/TypesDependencies';
import UsuarioAutenticacionEntity from '@modules/Autenticacion/domain/entities/UsuarioAutenticacionEntity';
import CustomError from '@common/util/CustomError';
import AutenticacionUseCase from '@modules/Autenticacion/usecase/services/AutenticacionUseCase';
import { IAutenticacionIn } from '@modules/Autenticacion/usecase/dto/in';
import EncriptacionService from '@infrastructure/services/EncriptacionService';

jest.mock('@common/dependencies/DependencyContainer');

describe('AutenticacionUseCase', () => {
  let autenticacionUseCase: AutenticacionUseCase;
  let mockAutenticacionRepository: jest.Mocked<AutenticacionRepository>;
  let mockTokenService: jest.Mocked<TokenService>;
  let mockEncriptacionService: jest.Mocked<EncriptacionService>;

  beforeEach(() => {
    mockAutenticacionRepository = {
      obtenerUsuario: jest.fn(),
    } as unknown as jest.Mocked<AutenticacionRepository>;

    mockTokenService = {
      generarToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;

    mockEncriptacionService = {
      verificar: jest.fn(),
    } as unknown as jest.Mocked<EncriptacionService>;

    (DEPENDENCY_CONTAINER.get as jest.Mock).mockImplementation((type) => {
      if (type === TYPESDEPENDENCIES.AutenticacionRepository) {
        return mockAutenticacionRepository;
      }
      if (type === TYPESDEPENDENCIESGLOBAL.TokenService) {
        return mockTokenService;
      }
      if (type === TYPESDEPENDENCIESGLOBAL.EncriptacionService) {
        return mockEncriptacionService;
      }
      return null;
    });

    autenticacionUseCase = new AutenticacionUseCase();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('debe validar al usuario y generar un token si las credenciales son válidas', async () => {
      const mockData: IAutenticacionIn = {
        usuario: 'usuario',
        clave: 'clave123'
      };

      const mockUsuario: UsuarioAutenticacionEntity = {
        id: 1,
        nombreUsuario: 'usuario',
        rol: 'admin',
        clave: 'clave_encriptada'
      } as UsuarioAutenticacionEntity;

      const mockToken = 'token123';

      // Mock de obtenerUsuario para que retorne el usuario
      mockAutenticacionRepository.obtenerUsuario.mockResolvedValue(mockUsuario);
      // Mock de verificar para que retorne true (credenciales válidas)
      mockEncriptacionService.verificar.mockResolvedValue(true);
      // Mock de generarToken
      mockTokenService.generarToken.mockReturnValue(mockToken);

      const result = await autenticacionUseCase.execute(mockData);

      // Verificamos que obtenerUsuario fue llamado con los datos correctos
      expect(mockAutenticacionRepository.obtenerUsuario).toHaveBeenCalledWith(mockData);
      
      // Verificamos que verificar fue llamado con la clave proporcionada y la almacenada
      expect(mockEncriptacionService.verificar).toHaveBeenCalledWith(
        mockData.clave,
        mockUsuario.clave
      );
      
      // Verificamos que generarToken fue llamado con el usuario
      expect(mockTokenService.generarToken).toHaveBeenCalledWith(mockUsuario);
      
      // Verificamos que el resultado es el token esperado
      expect(result).toBe(mockToken);
    });

    it('debe lanzar un error si el usuario no existe', async () => {
      const mockData: IAutenticacionIn = {
        usuario: 'usuario',
        clave: 'clave123'
      };

      mockAutenticacionRepository.obtenerUsuario.mockResolvedValue(null);

      await expect(autenticacionUseCase.execute(mockData)).rejects.toThrow(
        new CustomError('Usuario o contraseña incorrectos', 401, true)
      );

      expect(mockAutenticacionRepository.obtenerUsuario).toHaveBeenCalledWith(mockData);
      expect(mockEncriptacionService.verificar).not.toHaveBeenCalled();
      expect(mockTokenService.generarToken).not.toHaveBeenCalled();
    });

    it('debe lanzar un error si la contraseña es incorrecta', async () => {
      const mockData: IAutenticacionIn = {
        usuario: 'usuario',
        clave: 'clave_incorrecta'
      };

      const mockUsuario: UsuarioAutenticacionEntity = {
        id: 1,
        nombreUsuario: 'usuario',
        rol: 'admin',
        clave: 'clave_encriptada'
      } as UsuarioAutenticacionEntity;

      mockAutenticacionRepository.obtenerUsuario.mockResolvedValue(mockUsuario);
      mockEncriptacionService.verificar.mockResolvedValue(false);

      await expect(autenticacionUseCase.execute(mockData)).rejects.toThrow(
        new CustomError('Usuario o contraseña incorrectos', 401, true)
      );

      expect(mockAutenticacionRepository.obtenerUsuario).toHaveBeenCalledWith(mockData);
      expect(mockEncriptacionService.verificar).toHaveBeenCalledWith(
        mockData.clave,
        mockUsuario.clave
      );
      expect(mockTokenService.generarToken).not.toHaveBeenCalled();
    });

    it('debe propagar cualquier error que ocurra durante la obtención del usuario', async () => {
      const mockData: IAutenticacionIn = {
        usuario: 'usuario',
        clave: 'clave123'
      };

      const expectedError = new Error('Error en la base de datos');
      mockAutenticacionRepository.obtenerUsuario.mockRejectedValue(expectedError);

      await expect(autenticacionUseCase.execute(mockData)).rejects.toThrow(expectedError);
      expect(mockEncriptacionService.verificar).not.toHaveBeenCalled();
      expect(mockTokenService.generarToken).not.toHaveBeenCalled();
    });

    it('debe propagar cualquier error que ocurra durante la verificación de la contraseña', async () => {
      const mockData: IAutenticacionIn = {
        usuario: 'usuario',
        clave: 'clave123'
      };

      const mockUsuario: UsuarioAutenticacionEntity = {
        id: 1,
        nombreUsuario: 'usuario',
        rol: 'admin',
        clave: 'clave_encriptada'
      } as UsuarioAutenticacionEntity;

      const expectedError = new Error('Error verificando contraseña');
      mockAutenticacionRepository.obtenerUsuario.mockResolvedValue(mockUsuario);
      mockEncriptacionService.verificar.mockRejectedValue(expectedError);

      await expect(autenticacionUseCase.execute(mockData)).rejects.toThrow(expectedError);
      expect(mockTokenService.generarToken).not.toHaveBeenCalled();
    });

    it('debe propagar cualquier error que ocurra durante la generación del token', async () => {
      const mockData: IAutenticacionIn = {
        usuario: 'usuario',
        clave: 'clave123'
      };

      const mockUsuario: UsuarioAutenticacionEntity = {
        id: 1,
        nombreUsuario: 'usuario',
        rol: 'admin',
        clave: 'clave_encriptada'
      } as UsuarioAutenticacionEntity;

      const expectedError = new Error('Error generando token');
      mockAutenticacionRepository.obtenerUsuario.mockResolvedValue(mockUsuario);
      mockEncriptacionService.verificar.mockResolvedValue(true);
      mockTokenService.generarToken.mockImplementation(() => {
        throw expectedError;
      });

      await expect(autenticacionUseCase.execute(mockData)).rejects.toThrow(expectedError);
    });
  });

  describe('validarCredenciales', () => {
    it('debe retornar el usuario si las credenciales son válidas', async () => {
      const mockData: IAutenticacionIn = {
        usuario: 'usuario',
        clave: 'clave123'
      };

      const mockUsuario: UsuarioAutenticacionEntity = {
        id: 1,
        nombreUsuario: 'usuario',
        rol: 'admin',
        clave: 'clave_encriptada'
      } as UsuarioAutenticacionEntity;

      mockAutenticacionRepository.obtenerUsuario.mockResolvedValue(mockUsuario);
      mockEncriptacionService.verificar.mockResolvedValue(true);

      const useCase = new AutenticacionUseCase();
      const validarCredenciales = jest.spyOn(useCase as any, 'validarCredenciales');

      await useCase.execute(mockData);

      expect(validarCredenciales).toHaveBeenCalledWith(mockData);
      expect(mockAutenticacionRepository.obtenerUsuario).toHaveBeenCalledWith(mockData);
      expect(mockEncriptacionService.verificar).toHaveBeenCalledWith(
        mockData.clave, 
        mockUsuario.clave
      );
    });

    it('debe lanzar un error CustomError si las credenciales son inválidas', async () => {
      const mockData: IAutenticacionIn = {
        usuario: 'usuario',
        clave: 'clave_incorrecta'
      };

      const mockUsuario: UsuarioAutenticacionEntity = {
        id: 1,
        nombreUsuario: 'usuario',
        rol: 'admin',
        clave: 'clave_encriptada'
      } as UsuarioAutenticacionEntity;

      mockAutenticacionRepository.obtenerUsuario.mockResolvedValue(mockUsuario);
      mockEncriptacionService.verificar.mockResolvedValue(false);

      const useCase = new AutenticacionUseCase();
      const validarCredenciales = jest.spyOn(useCase as any, 'validarCredenciales');

      try {
        await useCase.execute(mockData);
        fail('Se esperaba que el método lanzara un error');
      } catch (error) {
        expect(error).toBeInstanceOf(CustomError);
        expect((error as CustomError).message).toBe('Usuario o contraseña incorrectos');
        expect((error as CustomError).statusCode).toBe(401);
      }

      expect(validarCredenciales).toHaveBeenCalledWith(mockData);
    });
  });

  describe('compararContrasenas', () => {
    it('debe llamar al servicio de encriptación para verificar las contraseñas', async () => {
      const useCase = new AutenticacionUseCase();
      const compararContrasenas = jest.spyOn(useCase as any, 'compararContrasenas');
      
      const contrasenaProporcionada = 'clave123';
      const contrasenaAlmacenada = 'clave_encriptada';
      
      mockEncriptacionService.verificar.mockResolvedValue(true);
      
      const mockData: IAutenticacionIn = {
        usuario: 'usuario',
        clave: contrasenaProporcionada
      };
      
      const mockUsuario: UsuarioAutenticacionEntity = {
        id: 1,
        nombreUsuario: 'usuario',
        rol: 'admin',
        clave: contrasenaAlmacenada
      } as UsuarioAutenticacionEntity;
      
      mockAutenticacionRepository.obtenerUsuario.mockResolvedValue(mockUsuario);
      
      await useCase.execute(mockData);
      
      expect(compararContrasenas).toHaveBeenCalledWith(
        contrasenaProporcionada, 
        contrasenaAlmacenada
      );
      
      expect(mockEncriptacionService.verificar).toHaveBeenCalledWith(
        contrasenaProporcionada, 
        contrasenaAlmacenada
      );
    });
  });
});
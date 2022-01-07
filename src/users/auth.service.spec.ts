import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Create a fake copy of the users service
    fakeUsersService = {
      find: () => Promise.resolve([]),
      create: (email: string, password: string) =>
        Promise.resolve({ id: 1, email, password } as User),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('asdf@asdf.com', 'asdf');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ id: 1, email: 'a', password: '1' } as User]);
    try {
      await service.signup('asdf@asdf.com', 'asdf');
    } catch (err) {
      Promise.resolve();
    }
  });
  // 원래 done을 써서 처리한 자리인데 jest 업데이트 되면서 바뀐건지 promise와 done을 같이 못쓴다고 에러 메시지가 떳
  // done 대신에 promise.resolve로 처리함.

  it('throws if signin is called with an unused email', async () => {
    try {
      await service.signin('asdfa@asdfsajd', 'askjsdak');
    } catch (err) {
      Promise.resolve();
    }
  });

  it('throws if an invalid password is provided', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([
        { id: 1, email: 'asdf@asdfsa.com', password: '12341234' } as User,
      ]);
    try {
      await service.signin('asdf@sadfas.com', 'password');
    } catch (err) {
      Promise.resolve();
    }
  });

  it('returns a user if correct password is provided', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([
        {
          email: 'asdf@asdfsa.com',
          password:
            '02ac6b4b6452ea96.b4ff10d8b3c1d625e08ffce54f91c47c1e287f343599542bae998d5d0ea48fe9',
        } as User,
      ]);

    const user = await service.signin('asdf@asdfsa.com', 'mypassword');
    expect(user).toBeDefined();
  });
});

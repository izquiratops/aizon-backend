import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import {
  RestApi,
  LambdaIntegration,
  CfnAuthorizer,
  AuthorizationType,
} from 'aws-cdk-lib/aws-apigateway';
import {
  UserPool,
  UserPoolClientIdentityProvider,
} from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import IAM_ACCESS_KEY from '../secret';

export class AizonServerlessStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const restApi = new RestApi(this, 'AizonApi', {
      restApiName: 'AizonApi',
    });

    const userPool = new UserPool(this, 'AizonUserPool', {
      signInAliases: { username: true, email: false },
      removalPolicy: RemovalPolicy.DESTROY,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
        requireUppercase: true,
        tempPasswordValidity: Duration.days(90),
      },
    });

    const appIntegrationClient = userPool.addClient('WebClient', {
      userPoolClientName: 'AizonWebClient',
      idTokenValidity: Duration.days(1),
      accessTokenValidity: Duration.days(1),
      authFlows: {
        adminUserPassword: true,
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
    });

    const authorizer = new CfnAuthorizer(this, 'cfnAuth', {
      restApiId: restApi.restApiId,
      name: 'AizonApiAuthorizer',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn],
    });

    // Shared functions settings
    const functionSettings: NodejsFunctionProps = {
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      memorySize: 256,
      timeout: Duration.seconds(30),
      environment: {
        ACCESS_KEY_ID: IAM_ACCESS_KEY.Id,
        ACCESS_KEY_SECRET: IAM_ACCESS_KEY.Secret,
        API_ID: restApi.restApiId,
        API_REGION: this.region,
        ACCOUNT_ID: this.account,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_APP_CLIENT_ID: appIntegrationClient.userPoolClientId,
      },
      // It's really needed?
      bundling: {
        minify: true,
      },
    };

    // AWS Function handlers
    const login = restApi.root.addResource('login');
    const postLoginFunction = new NodejsFunction(this, 'PostLoginFunction', {
      awsSdkConnectionReuse: true,
      entry: './src/api/login.ts',
      ...functionSettings,
    });
    login.addMethod('POST', new LambdaIntegration(postLoginFunction), {
      authorizationType: AuthorizationType.NONE,
    });

    const checkAuth = restApi.root.addResource('check-auth');
    const getCheckAuthFunction = new NodejsFunction(
      this,
      'GetCheckAuthFunction',
      {
        awsSdkConnectionReuse: true,
        entry: './src/api/check-auth.ts',
        ...functionSettings,
      }
    );
    checkAuth.addMethod('GET', new LambdaIntegration(getCheckAuthFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref,
      },
    });

    new CfnOutput(this, 'ApiURL', {
      value: restApi.url,
    });
  }
}

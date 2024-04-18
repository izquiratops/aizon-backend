import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import {
  RestApi,
  LambdaIntegration,
  CfnAuthorizer,
  AuthorizationType,
  MethodLoggingLevel,
} from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Runtime, Tracing } from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class AizonBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new RestApi(this, 'AizonApi', {
      restApiName: 'AizonApi',
      deployOptions: {
        tracingEnabled: false,
        dataTraceEnabled: false,
        metricsEnabled: false,
        loggingLevel: MethodLoggingLevel.INFO,
      },
    });

    const userPool = new UserPool(this, 'AizonUserPool', {
      selfSignUpEnabled: false,
      signInAliases: { username: true, email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: false,
        requireUppercase: true,
      },
    });

    const authorizer = new CfnAuthorizer(this, 'cfnAuth', {
      restApiId: api.restApiId,
      name: 'AizonApiAuthorizer',
      type: 'COGNITO_USER_POOLS',
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn],
    });

    // Node.js Functions
    const functionSettings: NodejsFunctionProps = {
      handler: 'handler',
      runtime: Runtime.NODEJS_LATEST,
      memorySize: 256,
      environment: {
        AWS_ACCOUNT_ID: Stack.of(this).account,
        AWS_USER_POOL_ID: userPool.userPoolId,
      },
      logRetention: RetentionDays.ONE_WEEK,
      bundling: {
        minify: true,
      },
    };

    const getHelloWorldFunction = new NodejsFunction(
      this,
      'GetHelloWorldFunction',
      {
        awsSdkConnectionReuse: true,
        entry: './src/api/hello-world.ts',
        ...functionSettings,
      }
    );

    // AWS Function handlers
    const helloWorld = api.root.addResource('helloworld');
    helloWorld.addMethod('POST', new LambdaIntegration(getHelloWorldFunction), {
      // TODO: Authorize other endpoints. Keep this for Login 🗝️
      // authorizationType: AuthorizationType.COGNITO,
      // authorizer: {
      //   authorizerId: authorizer.ref,
      // },
    });

    new CfnOutput(this, 'ApiURL', {
      value: api.url,
    });
  }
}

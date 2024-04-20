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
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import IAM_ACCESS_KEY from '../secret';

export class AizonServerlessStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const widgetTable = new Table(this, 'Widget', {
      tableName: 'Widget',
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const screenTable = new Table(this, 'Screen', {
      tableName: 'Screen',
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const restApi = new RestApi(this, 'AizonApi', {
      restApiName: 'AizonApi',
    });

    // Moved to AizonUserPool2 because I changed some attributes and messed up the first one
    const userPool = new UserPool(this, 'AizonUserPool2', {
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
      awsSdkConnectionReuse: true,
      environment: {
        ACCESS_KEY_ID: IAM_ACCESS_KEY.Id,
        ACCESS_KEY_SECRET: IAM_ACCESS_KEY.Secret,
        API_ID: restApi.restApiId,
        API_REGION: this.region,
        ACCOUNT_ID: this.account,
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_APP_CLIENT_ID: appIntegrationClient.userPoolClientId,
        WIDGET_TABLE_NAME: widgetTable.tableName,
        SCREEN_TABLE_NAME: screenTable.tableName,
      },
      bundling: {
        minify: true,
      },
    };

    // Function handlers
    const postLoginFunction = new NodejsFunction(this, 'PostLoginFunction', {
      entry: './src/api/login.ts',
      ...functionSettings,
    });

    const getWidgetsFunction = new NodejsFunction(this, 'GetWidgetsFunction', {
      entry: './src/api/widget/get-widgets.ts',
      ...functionSettings,
    });

    const getWidgetFunction = new NodejsFunction(this, 'GetWidgetFunction', {
      entry: './src/api/widget/get-widget.ts',
      ...functionSettings,
    });

    const putWidgetFunction = new NodejsFunction(this, 'PutWidgetFunction', {
      entry: './src/api/widget/put-widget.ts',
      ...functionSettings,
    });

    const deleteWidgetFunction = new NodejsFunction(
      this,
      'DeleteWidgetFunction',
      {
        entry: './src/api/widget/delete-widget.ts',
        ...functionSettings,
      }
    );

    const getScreensFunction = new NodejsFunction(this, 'GetScreensFunction', {
      entry: './src/api/screen/get-screens.ts',
      ...functionSettings,
    });

    const getScreenFunction = new NodejsFunction(this, 'GetScreenFunction', {
      entry: './src/api/screen/get-screen.ts',
      ...functionSettings,
    });

    const putScreenFunction = new NodejsFunction(this, 'PutScreenFunction', {
      entry: './src/api/screen/put-screen.ts',
      ...functionSettings,
    });

    const deleteScreenFunction = new NodejsFunction(
      this,
      'DeleteScreenFunction',
      {
        entry: './src/api/screen/delete-screen.ts',
        ...functionSettings,
      }
    );

    // DynamoDB Permissions
    widgetTable.grantReadData(getWidgetsFunction);
    widgetTable.grantReadData(getWidgetFunction);
    widgetTable.grantWriteData(putWidgetFunction);
    widgetTable.grantWriteData(deleteWidgetFunction);

    screenTable.grantReadData(getScreensFunction);
    screenTable.grantReadData(getScreenFunction);
    screenTable.grantWriteData(putScreenFunction);
    screenTable.grantWriteData(deleteScreenFunction);

    // Resources and Methods
    const login = restApi.root.addResource('login');
    login.addMethod('POST', new LambdaIntegration(postLoginFunction), {
      authorizationType: AuthorizationType.NONE,
    });

    const widgets = restApi.root.addResource('widgets');
    widgets.addMethod('GET', new LambdaIntegration(getWidgetsFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref,
      },
    });

    const widget = widgets.addResource('{id}');
    widget.addMethod('GET', new LambdaIntegration(getWidgetFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref,
      },
    });
    widget.addMethod('PUT', new LambdaIntegration(putWidgetFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref,
      },
    });
    widget.addMethod('DELETE', new LambdaIntegration(deleteWidgetFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref,
      },
    });

    const screens = restApi.root.addResource('screens');
    screens.addMethod('GET', new LambdaIntegration(getScreensFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref,
      },
    });

    const screen = screens.addResource('{id}');
    screen.addMethod('GET', new LambdaIntegration(getScreenFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref,
      },
    });
    screen.addMethod('PUT', new LambdaIntegration(putScreenFunction), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: authorizer.ref,
      },
    });
    screen.addMethod('DELETE', new LambdaIntegration(deleteScreenFunction), {
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

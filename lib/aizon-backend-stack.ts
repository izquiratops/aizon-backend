import {
  CfnOutput,
  Stack,
  StackProps,
  aws_apigateway,
  aws_lambda_nodejs,
  aws_lambda,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class AizonBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const esBuildSettings = {
      minify: true,
    };

    const functionSettings: aws_lambda_nodejs.NodejsFunctionProps = {
      handler: 'handler',
      runtime: aws_lambda.Runtime.NODEJS_LATEST,
      memorySize: 256,
      bundling: esBuildSettings,
    };

    const getHelloWorldFunction = new aws_lambda_nodejs.NodejsFunction(
      this,
      'GetHelloWorldFunction',
      {
        awsSdkConnectionReuse: true,
        entry: './src/api/hello-world.ts',
        ...functionSettings,
      }
    );

    const api = new aws_apigateway.RestApi(this, 'AizonBackendApi', {
      restApiName: 'AizonBackendApi',
    });

    const helloWorld = api.root.addResource('helloworld');
    helloWorld.addMethod(
      'GET',
      new aws_apigateway.LambdaIntegration(getHelloWorldFunction)
    );

    new CfnOutput(this, 'ApiURL', {
      value: api.url,
    });
  }
}

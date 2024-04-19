#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AizonServerlessStack } from '../lib/aizon-serverless-stack';

const app = new cdk.App();
new AizonServerlessStack(app, 'AizonServerlessStack', {});
